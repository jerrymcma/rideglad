import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 60 * 60 * 1000; // 60 minutes
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Clean and filter domains to handle malformed input
  const domains = process.env.REPLIT_DOMAINS!
    .split(",")
    .map(domain => domain.trim())
    .filter(domain => domain && domain.length > 0 && !domain.includes(" "))
    .map(domain => {
      // Remove www. prefix and fix duplicate domains
      let cleanDomain = domain.replace(/^www\./, "");
      // Fix duplicated domains like "domain.comDomain.com"
      const parts = cleanDomain.split(".replit.app");
      if (parts.length > 2) {
        cleanDomain = parts[parts.length - 2] + ".replit.app";
      }
      return cleanDomain;
    })
    .filter(domain => {
      // Accept replit.app, replit.dev, or any other valid domains
      return domain.includes(".replit.") || domain === "ride-glad.com";
    });

  console.log("Cleaned domains:", domains);

  // Track created strategies to avoid duplicates
  const createdStrategies = new Set<string>();
  
  // Create a dynamic strategy creation function
  const createStrategyForDomain = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    
    if (!createdStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      createdStrategies.add(strategyName);
      console.log(`Created strategy for domain: ${domain}`);
    }
  };

  // Create strategies for configured domains
  for (const domain of domains) {
    createStrategyForDomain(domain);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => {
    try {
      cb(null, user);
    } catch (error) {
      console.log('Session deserialization error:', error);
      cb(null, false); // Clear invalid session
    }
  });

  // Middleware to ensure strategy exists for any request
  app.use((req, res, next) => {
    if (req.hostname && (req.hostname.includes('.replit.') || req.hostname.includes('ride-glad'))) {
      createStrategyForDomain(req.hostname);
    }
    next();
  });

  app.get("/api/login", (req, res, next) => {
    // Ensure strategy exists for current hostname
    createStrategyForDomain(req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Ensure strategy exists for current hostname
    createStrategyForDomain(req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
