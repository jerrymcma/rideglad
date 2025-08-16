import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTripSchema, insertVehicleSchema, insertRatingSchema, insertPaymentMethodSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
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

  // Driver status toggle
  app.patch('/api/drivers/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isActive } = req.body;
      
      const updatedUser = await storage.toggleDriverStatus(userId, isActive);
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
      
      // Auto-assign John Driver after 3 seconds (simulate driver matching)
      setTimeout(async () => {
        try {
          await storage.updateTripStatus(trip.id, 'matched', {
            driverId: 'mock-driver-1',
          });
          console.log(`Trip ${trip.id} automatically matched with John Driver`);
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
      res.json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(400).json({ message: error instanceof z.ZodError ? error.errors : "Invalid rating data" });
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
      if (activeTrip) {
        const now = new Date();
        const tripAge = now.getTime() - new Date(activeTrip.requestedAt).getTime();
        const timeoutDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        if (tripAge > timeoutDuration) {
          console.log(`Trip ${activeTrip.id} timed out, auto-cancelling`);
          await storage.updateTripStatus(activeTrip.id, 'cancelled', {
            cancelReason: 'timeout',
            completedAt: now
          });
          activeTrip = null; // Return null since trip was cancelled
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

      // Map ride types to specific drivers
      const driverMapping = {
        'driver-1': 'mock-driver-1',
        'driver-2': 'mock-driver-2', 
        'driver-3': 'mock-driver-3'
      };

      const driverId = driverMapping[trip.rideType as keyof typeof driverMapping];
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

  app.patch('/api/payment-methods/:id/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.setDefaultPaymentMethod(userId, req.params.id);
      res.json({ message: "Default payment method updated" });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "Failed to set default payment method" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
