import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Setup WebSocket server for real-time communication on /ws path
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });
  
  // Store connected drivers and riders
  const connectedDrivers = new Map();
  const connectedRiders = new Map();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'driver_online':
            connectedDrivers.set(message.driverId, ws);
            console.log(`Driver ${message.driverId} connected`);
            break;
            
          case 'driver_offline':
            connectedDrivers.delete(message.driverId);
            console.log(`Driver ${message.driverId} disconnected`);
            break;
            
          case 'rider_connected':
            connectedRiders.set(message.riderId, ws);
            console.log(`Rider ${message.riderId} connected`);
            break;
            
          case 'location_update':
            // Broadcast location update to relevant parties
            if (message.userType === 'driver') {
              // Send driver location to matched rider
              const riderWs = connectedRiders.get(message.riderId);
              if (riderWs) {
                riderWs.send(JSON.stringify({
                  type: 'driver_location',
                  location: message.location,
                  driverId: message.driverId
                }));
              }
            }
            break;
            
          case 'new_ride_request':
            // Notify all online drivers about new ride request
            connectedDrivers.forEach((driverWs) => {
              driverWs.send(JSON.stringify({
                type: 'ride_request',
                trip: message.trip
              }));
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Clean up disconnected clients
      connectedDrivers.forEach((driverWs, driverId) => {
        if (driverWs === ws) {
          connectedDrivers.delete(driverId);
        }
      });
      connectedRiders.forEach((riderWs, riderId) => {
        if (riderWs === ws) {
          connectedRiders.delete(riderId);
        }
      });
      console.log('WebSocket client disconnected');
    });
  });
  
  // Make WebSocket available to routes
  app.set('wss', wss);
  app.set('connectedDrivers', connectedDrivers);
  app.set('connectedRiders', connectedRiders);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
