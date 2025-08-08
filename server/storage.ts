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
  getTripsByUser(userId: string): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  updateTripStatus(id: string, status: string, additionalData?: Partial<Trip>): Promise<Trip>;
  getActiveTrip(userId: string): Promise<Trip | undefined>;
  
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
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async getVehiclesByDriver(driverId: string): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
  }

  async updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // Trip operations
  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTripsByUser(userId: string): Promise<Trip[]> {
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
    const updateData: Partial<Trip> = { status, ...additionalData };
    
    // Set timestamps based on status
    if (status === 'matched') updateData.matchedAt = new Date();
    if (status === 'in_progress') updateData.startedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();

    const [updatedTrip] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async getActiveTrip(userId: string): Promise<Trip | undefined> {
    const [activeTrip] = await db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.riderId, userId),
          sql`${trips.status} NOT IN ('completed', 'cancelled')`
        )
      )
      .orderBy(desc(trips.requestedAt))
      .limit(1);
    return activeTrip;
  }

  // Driver operations
  async getAvailableDrivers(lat: number, lng: number, rideType: string): Promise<(User & { vehicle: Vehicle })[]> {
    // For simplicity, return drivers who are active and have vehicles
    // In a real app, you'd calculate distance based on coordinates
    const driversWithVehicles = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        phone: users.phone,
        userType: users.userType,
        rating: users.rating,
        totalRatings: users.totalRatings,
        isDriverActive: users.isDriverActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        vehicle: vehicles,
      })
      .from(users)
      .innerJoin(vehicles, eq(vehicles.driverId, users.id))
      .where(
        and(
          eq(users.isDriverActive, true),
          eq(vehicles.vehicleType, rideType)
        )
      )
      .limit(10);

    return driversWithVehicles;
  }

  async toggleDriverStatus(driverId: string, isActive: boolean): Promise<User> {
    const [updatedDriver] = await db
      .update(users)
      .set({ isDriverActive: isActive, updatedAt: new Date() })
      .where(eq(users.id, driverId))
      .returning();
    return updatedDriver;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    
    // Update user's average rating
    if (rating.toUserId) {
      const userRatings = await db
        .select()
        .from(ratings)
        .where(eq(ratings.toUserId, rating.toUserId));
      
      const avgRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;
      
      await db
        .update(users)
        .set({ rating: avgRating, totalRatings: userRatings.length })
        .where(eq(users.id, rating.toUserId));
    }
    
    return newRating;
  }

  async getRatingsByTrip(tripId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.tripId, tripId));
  }

  // Payment operations
  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newPaymentMethod] = await db.insert(paymentMethods).values(paymentMethod).returning();
    return newPaymentMethod;
  }

  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // Remove default from all user's payment methods
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));
    
    // Set the selected one as default
    await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(eq(paymentMethods.id, paymentMethodId));
  }
}

export const storage = new DatabaseStorage();
