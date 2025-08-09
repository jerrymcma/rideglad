import {
  users,
  vehicles,
  trips,
  ratings,
  paymentMethods,
  type User,
  type UpsertUser,
  type Vehicle,
  type InsertVehicle,
  type Trip,
  type InsertTrip,
  type Rating,
  type InsertRating,
  type PaymentMethod,
  type InsertPaymentMethod,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Vehicle operations
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getVehiclesByDriver(driverId: string): Promise<Vehicle[]>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  
  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  getTrip(id: string): Promise<Trip | undefined>;
  getUserTrips(userId: string): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  updateTripStatus(id: string, status: string, additionalData?: Partial<Trip>): Promise<Trip>;
  getActiveTrip(userId: string): Promise<Trip | undefined>;
  cancelTrip(tripId: string, userId: string): Promise<Trip>;
  
  // Driver operations
  getAvailableDrivers(lat: number, lng: number, rideType: string): Promise<(User & { vehicle: Vehicle })[]>;
  toggleDriverStatus(driverId: string, isActive: boolean): Promise<User>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByTrip(tripId: string): Promise<Rating[]>;
  
  // Payment operations
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Vehicle operations
  async createVehicle(vehicleData: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return vehicle;
  }

  async getVehiclesByDriver(driverId: string): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
  }

  async updateVehicle(id: string, vehicleData: Partial<InsertVehicle>): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set(vehicleData)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // Trip operations
  async createTrip(tripData: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values(tripData).returning();
    return trip;
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getUserTrips(userId: string): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.riderId, userId))
      .orderBy(desc(trips.requestedAt));
  }

  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.driverId, driverId))
      .orderBy(desc(trips.requestedAt));
  }

  async updateTripStatus(id: string, status: string, additionalData?: Partial<Trip>): Promise<Trip> {
    const updateData: any = { status };
    
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    // Add timestamp based on status
    if (status === 'matched') {
      updateData.matchedAt = new Date();
    } else if (status === 'in_progress') {
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [trip] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, id))
      .returning();
    return trip;
  }

  async getActiveTrip(userId: string): Promise<Trip | undefined> {
    const [trip] = await db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.riderId, userId),
          sql`${trips.status} IN ('requested', 'matched', 'pickup', 'in_progress')`
        )
      )
      .orderBy(desc(trips.requestedAt))
      .limit(1);
    return trip;
  }

  async cancelTrip(tripId: string, userId: string): Promise<Trip> {
    const [trip] = await db
      .update(trips)
      .set({ status: 'cancelled' })
      .where(and(eq(trips.id, tripId), eq(trips.riderId, userId)))
      .returning();
    return trip;
  }

  // Driver operations
  async getAvailableDrivers(lat: number, lng: number, rideType: string): Promise<(User & { vehicle: Vehicle })[]> {
    // Simplified mock implementation
    return [];
  }

  async toggleDriverStatus(driverId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isDriverActive: isActive, updatedAt: new Date() })
      .where(eq(users.id, driverId))
      .returning();
    return user;
  }

  // Rating operations
  async createRating(ratingData: InsertRating): Promise<Rating> {
    const [rating] = await db.insert(ratings).values(ratingData).returning();
    return rating;
  }

  async getRatingsByTrip(tripId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.tripId, tripId));
  }

  // Payment operations
  async createPaymentMethod(paymentData: InsertPaymentMethod): Promise<PaymentMethod> {
    const [payment] = await db.insert(paymentMethods).values(paymentData).returning();
    return payment;
  }

  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // First, remove default from all user's payment methods
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));

    // Then set the selected one as default
    await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
