import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTripSchema, insertVehicleSchema, insertRatingSchema, insertPaymentMethodSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

// Stripe setup - will be initialized when keys are provided
let stripe: any = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
} catch (error) {
  console.log('Stripe not initialized - API keys not provided');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Password Authentication Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const newUser = await storage.upsertUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        userType: 'rider',
      });
      
      // Set up session (simplified)
      (req.session as any).userId = newUser.id;
      (req.session as any).isPasswordAuth = true;
      
      res.status(201).json({ 
        message: "Registration successful",
        user: { ...newUser, password: undefined } // Don't send password back
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set up session
      (req.session as any).userId = user.id;
      (req.session as any).isPasswordAuth = true;
      
      res.json({ 
        message: "Login successful",
        user: { ...user, password: undefined } // Don't send password back
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth routes (existing OAuth)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userType, phone } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        userType,
        phone,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Comprehensive profile update endpoint
  app.patch('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email, phone, bio } = req.body;
      
      // Get current user data
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user with new data, preserving existing fields
      const updatedUser = await storage.upsertUser({
        ...currentUser,
        firstName: firstName || currentUser.firstName,
        lastName: lastName || currentUser.lastName,
        email: email || currentUser.email,
        phone: phone || currentUser.phone,
        bio: bio !== undefined ? bio : currentUser.bio,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile picture upload endpoints
  app.post('/api/profile/upload-url', isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting profile picture upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.patch('/api/profile/picture', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { profilePictureURL } = req.body;

      if (!profilePictureURL) {
        return res.status(400).json({ error: "profilePictureURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for the profile picture (public visibility)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        profilePictureURL,
        {
          owner: userId,
          visibility: "public", // Profile pictures are public
        }
      );

      // Update user's profile picture URL in database
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...currentUser,
        profileImageUrl: objectPath,
      });

      res.json({ user: updatedUser, objectPath });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  });

  // Serve profile pictures
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(404); // Don't reveal existence
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving profile picture:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Driver status toggle
  app.patch('/api/drivers/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isActive } = req.body;
      
      // If driver is going offline, handle any active trips
      if (!isActive) {
        const activeTrip = await storage.getActiveDriverTrip(userId);
        if (activeTrip) {
          // Cancel the trip when driver goes offline
          await storage.updateTripStatus(activeTrip.id, 'cancelled', {
            cancelReason: 'driver_offline',
            completedAt: new Date()
          });
          
          // Notify the rider that their trip was cancelled
          const connectedRiders = req.app.get('connectedRiders');
          if (connectedRiders) {
            const riderWs = connectedRiders.get(activeTrip.riderId);
            if (riderWs && riderWs.readyState === 1) {
              riderWs.send(JSON.stringify({
                type: 'trip_cancelled',
                tripId: activeTrip.id,
                reason: 'driver_offline'
              }));
            }
          }
        }
      }
      
      const updatedUser = await storage.toggleDriverStatus(userId, isActive);
      
      // Notify all riders about driver availability changes
      const connectedRiders = req.app.get('connectedRiders');
      if (connectedRiders) {
        connectedRiders.forEach((ws: any) => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify({
              type: 'driver_availability_changed',
              driverId: userId,
              isActive: isActive,
              driver: updatedUser
            }));
          }
        });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling driver status:", error);
      res.status(500).json({ message: "Failed to toggle driver status" });
    }
  });

  // Trip routes
  app.get('/api/trips/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeTrip = await storage.getActiveTrip(userId);
      res.json(activeTrip || null);
    } catch (error) {
      console.error("Error fetching active trip:", error);
      res.status(500).json({ message: "Failed to fetch active trip" });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = insertTripSchema.parse({
        ...req.body,
        riderId: userId,
        status: 'requested',
      });
      
      const trip = await storage.createTrip(tripData);
      
      // Broadcast new ride request to all connected drivers
      const connectedDrivers = req.app.get('connectedDrivers');
      if (connectedDrivers) {
        connectedDrivers.forEach((driverWs: any) => {
          driverWs.send(JSON.stringify({
            type: 'ride_request',
            trip: trip
          }));
        });
      }
      
      // Auto-assign selected driver after 3 seconds (simulate driver matching)
      setTimeout(async () => {
        try {
          // Use the selected driver from rideType
          const selectedDriverId = trip.rideType;
          await storage.updateTripStatus(trip.id, 'matched', {
            driverId: selectedDriverId,
          });
          console.log(`Trip ${trip.id} automatically matched with selected driver ${selectedDriverId}`);
          
          // Notify rider that driver was found
          const connectedRiders = req.app.get('connectedRiders');
          if (connectedRiders) {
            const riderWs = connectedRiders.get(userId);
            if (riderWs) {
              riderWs.send(JSON.stringify({
                type: 'driver_matched',
                tripId: trip.id,
                driverId: selectedDriverId
              }));
            }
          }
        } catch (error) {
          console.error('Error auto-assigning driver:', error);
        }
      }, 3000);
      
      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid trip data" });
    }
  });

  app.post('/api/trips/:tripId/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tripId } = req.params;
      
      const trip = await storage.cancelTrip(tripId, userId);
      res.json(trip);
    } catch (error) {
      console.error("Error cancelling trip:", error);
      res.status(500).json({ message: "Failed to cancel trip" });
    }
  });

  app.get('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let trips;
      if (user?.userType === 'driver') {
        trips = await storage.getTripsByDriver(userId);
      } else {
        trips = await storage.getUserTrips(userId);
      }
      
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  // Rating routes
  app.post('/api/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        fromUserId: userId,
      });
      
      const rating = await storage.createRating(ratingData);
      
      // Mark the trip as completed when rating is submitted
      if (ratingData.tripId) {
        // Get the trip to get the estimated price for final price calculation
        const trip = await storage.getTrip(ratingData.tripId);
        await storage.updateTripStatus(ratingData.tripId, 'completed', {
          finalPrice: trip?.estimatedPrice
        });
      }
      
      res.json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid rating data" });
    }
  });

  // Get active/online drivers for riders to see
  app.get('/api/drivers/active', async (req, res) => {
    try {
      const activeDrivers = await storage.getActiveDrivers();
      res.json(activeDrivers);
    } catch (error) {
      console.error("Error fetching active drivers:", error);
      res.status(500).json({ message: "Failed to fetch active drivers" });
    }
  });

  // Get user by ID
  app.get('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get vehicles by driver ID
  app.get('/api/vehicles/driver/:driverId', async (req, res) => {
    try {
      const { driverId } = req.params;
      const vehicles = await storage.getVehiclesByDriver(driverId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Driver-specific routes
  app.get('/api/drivers/available-rides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'driver' || !user.isDriverActive) {
        return res.status(403).json({ message: "Driver not active" });
      }
      
      // Get pending ride requests (status: 'requested')
      const availableRides = await storage.getAvailableRideRequests();
      res.json(availableRides);
    } catch (error) {
      console.error("Error fetching available rides:", error);
      res.status(500).json({ message: "Failed to fetch available rides" });
    }
  });

  app.post('/api/drivers/accept-ride/:tripId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tripId } = req.params;
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'driver' || !user.isDriverActive) {
        return res.status(403).json({ message: "Driver not active" });
      }
      
      // Get driver's vehicle
      const driverVehicles = await storage.getVehiclesByDriver(userId);
      if (driverVehicles.length === 0) {
        return res.status(400).json({ message: "Driver has no registered vehicle" });
      }
      
      // Accept the ride
      const trip = await storage.updateTripStatus(tripId, 'matched', {
        driverId: userId,
        vehicleId: driverVehicles[0].id,
        matchedAt: new Date()
      });
      
      res.json(trip);
    } catch (error) {
      console.error("Error accepting ride:", error);
      res.status(500).json({ message: "Failed to accept ride" });
    }
  });

  app.get('/api/drivers/active-trip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.userType !== 'driver') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const activeTrip = await storage.getActiveDriverTrip(userId);
      res.json(activeTrip || null);
    } catch (error) {
      console.error("Error fetching active driver trip:", error);
      res.status(500).json({ message: "Failed to fetch active trip" });
    }
  });

  // Vehicle routes
  app.post('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        driverId: userId,
      });
      
      const vehicle = await storage.createVehicle(vehicleData);
      res.json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid vehicle data" });
    }
  });

  app.get('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vehicles = await storage.getVehiclesByDriver(userId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Trip routes
  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = insertTripSchema.parse({
        ...req.body,
        riderId: userId,
      });
      
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid trip data" });
    }
  });

  app.get('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trips = await storage.getTripsByUser(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get('/api/trips/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let activeTrip = await storage.getActiveTrip(userId);
      
      // Check if trip has timed out (older than 10 minutes)
      if (activeTrip && activeTrip.requestedAt) {
        const now = new Date();
        const tripAge = now.getTime() - new Date(activeTrip.requestedAt).getTime();
        const timeoutDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        if (tripAge > timeoutDuration) {
          console.log(`Trip ${activeTrip.id} timed out, auto-cancelling`);
          await storage.updateTripStatus(activeTrip.id, 'cancelled', {
            cancelReason: 'timeout',
            completedAt: now
          });
          activeTrip = undefined; // Return undefined since trip was cancelled
        }
      }
      
      res.json(activeTrip || null);
    } catch (error) {
      console.error("Error fetching active trip:", error);
      res.status(500).json({ message: "Failed to fetch active trip" });
    }
  });

  app.get('/api/trips/:id', isAuthenticated, async (req: any, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.patch('/api/trips/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status, ...additionalData } = req.body;
      const trip = await storage.updateTripStatus(req.params.id, status, additionalData);
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip status:", error);
      res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  // Driver matching
  app.post('/api/trips/:id/match', isAuthenticated, async (req: any, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Use the rideType directly as the driver ID (since we now use actual driver IDs)
      const driverId = trip.rideType;
      if (!driverId) {
        return res.status(404).json({ message: "Invalid driver selection" });
      }

      // Get the specific selected driver
      const selectedDriver = await storage.getDriverById(driverId);
      if (!selectedDriver) {
        return res.status(404).json({ message: "Selected driver not available" });
      }
      
      const updatedTrip = await storage.updateTripStatus(req.params.id, 'matched', {
        driverId: selectedDriver.id,
        vehicleId: selectedDriver.vehicle.id,
      });
      
      res.json({ trip: updatedTrip, driver: selectedDriver });
    } catch (error) {
      console.error("Error matching driver:", error);
      res.status(500).json({ message: "Failed to match driver" });
    }
  });

  // Enhanced pricing calculation with custom pricing plans
  app.post('/api/trips/calculate-price', isAuthenticated, async (req: any, res) => {
    try {
      const { distance, rideType, promoCode } = req.body;
      const userId = req.user.claims.sub;
      
      // Ensure pricing plans exist
      await storage.ensurePricingPlans();
      
      const estimatedDuration = Math.max(distance * 2, 5); // Rough estimate: 2 min per km, minimum 5 min
      
      const pricing = await storage.calculateTripPrice({
        distance,
        duration: estimatedDuration,
        rideType,
        pickupTime: new Date(),
        pickupLat: 40.7128, // Default NYC coordinates
        pickupLng: -74.0060,
        promoCode,
        userId
      });
      
      res.json({
        estimatedPrice: pricing.finalPrice.toFixed(2),
        estimatedDuration,
        breakdown: pricing.breakdown,
        adjustments: pricing.adjustments
      });
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  // Pricing management endpoints
  app.get('/api/pricing/plans', isAuthenticated, async (req: any, res) => {
    try {
      await storage.ensurePricingPlans();
      const plans = await storage.getActivePricingPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      res.status(500).json({ message: "Failed to fetch pricing plans" });
    }
  });

  app.post('/api/pricing/validate-promo', isAuthenticated, async (req: any, res) => {
    try {
      const { code, tripValue } = req.body;
      const userId = req.user.claims.sub;
      
      const validation = await storage.validatePromoCode(code, userId, tripValue);
      res.json(validation);
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  // Rating routes
  app.post('/api/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        fromUserId: userId,
      });
      
      const rating = await storage.createRating(ratingData);
      
      // Mark the trip as completed when rating is submitted
      if (ratingData.tripId) {
        // Get the trip to get the estimated price for final price calculation
        const trip = await storage.getTrip(ratingData.tripId);
        await storage.updateTripStatus(ratingData.tripId, 'completed', {
          finalPrice: trip?.estimatedPrice
        });
      }
      
      res.json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid rating data" });
    }
  });

  app.get('/api/trips/:id/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const ratings = await storage.getRatingsByTrip(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Payment method routes
  app.post('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const paymentData = insertPaymentMethodSchema.parse({
        ...req.body,
        userId,
      });
      
      const paymentMethod = await storage.createPaymentMethod(paymentData);
      res.json(paymentMethod);
    } catch (error) {
      console.error("Error creating payment method:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid payment method data" });
    }
  });

  app.get('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const paymentMethods = await storage.getPaymentMethodsByUser(userId);
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.delete('/api/payment-methods/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deletePaymentMethod(req.params.id);
      res.json({ message: "Payment method deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  app.put('/api/payment-methods/:id/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.setDefaultPaymentMethod(userId, req.params.id);
      res.json({ message: "Default payment method updated" });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "Failed to set default payment method" });
    }
  });

  app.post('/api/process-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethodId, tripId, amount } = req.body;
      
      const result = await storage.processPayment({
        paymentMethodId,
        tripId,
        amount,
        userId
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  app.get('/api/payment-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getPaymentHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Wallet endpoints - Stripe integration ready
  app.post('/api/wallet/add-card', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cardNumber, expiryMonth, expiryYear, cvc, name, zipCode } = req.body;

      if (!stripe) {
        // Fallback for demo purposes - store card info securely
        const last4 = cardNumber.slice(-4);
        const cardType = cardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD';
        
        const paymentMethod = await storage.createPaymentMethod({
          userId,
          type: 'card',
          lastFour: last4,
          brand: cardType,
          expiryMonth: parseInt(expiryMonth),
          expiryYear: parseInt(expiryYear),
          cardholderName: name,
          isDefault: false
        });

        return res.json(paymentMethod);
      }

      // Full Stripe integration when keys are available
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: expiryMonth,
          exp_year: expiryYear,
          cvc: cvc,
        },
        billing_details: {
          name: name,
          address: {
            postal_code: zipCode,
          },
        },
      });

      const savedMethod = await storage.createPaymentMethod({
        userId,
        type: 'card',
        lastFour: paymentMethod.card.last4,
        brand: paymentMethod.card.brand.toUpperCase(),
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        cardholderName: name,
        stripePaymentMethodId: paymentMethod.id,
        isDefault: false
      });

      res.json(savedMethod);
    } catch (error) {
      console.error("Error adding card:", error);
      res.status(500).json({ message: "Failed to add card" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
