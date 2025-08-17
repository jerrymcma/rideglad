import {
  users,
  vehicles,
  trips,
  ratings,
  paymentMethods,
  payments,
  pricingPlans,
  pricingRules,
  promoCodes,
  userPromoUsage,
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
  type Payment,
  type InsertPayment,
  type PricingPlan,
  type InsertPricingPlan,
  type PricingRule,
  type InsertPricingRule,
  type PromoCode,
  type InsertPromoCode,
  type UserPromoUsage,
  type InsertUserPromoUsage,
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
  getUserTrips(userId: string): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  updateTripStatus(id: string, status: string, additionalData?: Partial<Trip>): Promise<Trip>;
  getActiveTrip(userId: string): Promise<Trip | undefined>;
  cancelTrip(tripId: string, userId: string): Promise<Trip>;
  
  // Driver operations
  getAvailableDrivers(lat: number, lng: number, rideType: string): Promise<(User & { vehicle: Vehicle })[]>;
  getAvailableRideRequests(): Promise<Trip[]>;
  getActiveDriverTrip(driverId: string): Promise<Trip | undefined>;
  toggleDriverStatus(driverId: string, isActive: boolean): Promise<User>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByTrip(tripId: string): Promise<Rating[]>;
  
  // Payment operations
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]>;
  updatePaymentMethod(id: string, paymentMethod: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
  
  // Payment processing
  processPayment(payment: { paymentMethodId: string; tripId: string; amount: number; userId: string }): Promise<{ paymentId: string; status: string }>;
  
  // Pricing Plan operations
  createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan>;
  getPricingPlans(): Promise<PricingPlan[]>;
  getActivePricingPlans(): Promise<PricingPlan[]>;
  getPricingPlan(id: string): Promise<PricingPlan | undefined>;
  updatePricingPlan(id: string, plan: Partial<InsertPricingPlan>): Promise<PricingPlan>;
  deletePricingPlan(id: string): Promise<void>;
  
  // Pricing Rule operations
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  getActivePricingRules(): Promise<PricingRule[]>;
  updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule>;
  deletePricingRule(id: string): Promise<void>;
  
  // Promo Code operations
  createPromoCode(promo: InsertPromoCode): Promise<PromoCode>;
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  validatePromoCode(code: string, userId: string, tripValue: number): Promise<{ valid: boolean; discount?: number; reason?: string }>;
  usePromoCode(promoId: string, userId: string, tripId: string, discountAmount: number): Promise<UserPromoUsage>;
  
  // Pricing calculation
  calculateTripPrice(params: {
    distance: number;
    duration: number;
    rideType: string;
    pickupTime: Date;
    pickupLat: number;
    pickupLng: number;
    promoCode?: string;
    userId: string;
  }): Promise<{
    basePrice: number;
    adjustments: Array<{ type: string; amount: number; description: string }>;
    finalPrice: number;
    breakdown: {
      baseFare: number;
      distanceCharge: number;
      surgeFee?: number;
      bookingFee?: number;
      discount?: number;
    };
  }>;
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

  async getTripsByUser(userId: string): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.riderId, userId))
      .orderBy(desc(trips.requestedAt));
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
      
      // Calculate driver earnings (90% of final price) and platform fee (10%)
      if (additionalData?.finalPrice) {
        const finalPrice = parseFloat(additionalData.finalPrice.toString());
        const driverEarnings = Math.round(finalPrice * 0.90 * 100) / 100; // 90% to driver
        const platformFee = Math.round(finalPrice * 0.10 * 100) / 100; // 10% platform fee
        
        updateData.driverEarnings = driverEarnings.toString();
        updateData.platformFee = platformFee.toString();
      }
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

  async getAvailableRideRequests(): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.status, 'requested'))
      .orderBy(desc(trips.requestedAt));
  }

  async getActiveDriverTrip(driverId: string): Promise<Trip | undefined> {
    const [trip] = await db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.driverId, driverId),
          sql`${trips.status} IN ('matched', 'pickup', 'in_progress')`
        )
      )
      .orderBy(desc(trips.requestedAt))
      .limit(1);
    return trip;
  }

  async getDriverById(driverId: string): Promise<(User & { vehicle: Vehicle }) | null> {
    // First, ensure mock drivers exist in database
    await this.ensureMockDrivers();
    
    const driverWithVehicle = await db
      .select()
      .from(users)
      .leftJoin(vehicles, eq(vehicles.driverId, users.id))
      .where(eq(users.id, driverId))
      .limit(1);

    if (driverWithVehicle.length === 0 || !driverWithVehicle[0].vehicles) {
      return null;
    }

    return {
      ...driverWithVehicle[0].users,
      vehicle: driverWithVehicle[0].vehicles
    };
  }

  private async ensureMockDrivers(): Promise<void> {
    // Check if mock drivers exist
    const existingDrivers = await db
      .select()
      .from(users)
      .where(eq(users.userType, 'driver'))
      .limit(3);

    if (existingDrivers.length >= 3) {
      return; // Mock drivers already exist
    }

    // Create mock drivers
    const mockDrivers = [
      {
        id: 'mock-driver-1',
        email: 'john@rideshare.com',
        firstName: 'John',
        lastName: 'Driver',
        userType: 'driver' as const,
        isDriverActive: true,
        vehicle: { make: 'Toyota', model: 'Camry', year: 2022, color: 'Blue', licensePlate: '107' }
      },
      {
        id: 'mock-driver-2',
        email: 'sarah@rideshare.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        userType: 'driver' as const,
        isDriverActive: true,
        vehicle: { make: 'Honda', model: 'CR-V', year: 2023, color: 'White', licensePlate: '208' }
      },
      {
        id: 'mock-driver-3',
        email: 'michael@rideshare.com',
        firstName: 'Michael',
        lastName: 'Chen',
        userType: 'driver' as const,
        isDriverActive: true,
        vehicle: { make: 'BMW', model: '3 Series', year: 2024, color: 'Black', licensePlate: '309' }
      }
    ];

    for (const mockDriver of mockDrivers) {
      try {
        // Insert or update driver
        await db
          .insert(users)
          .values({
            id: mockDriver.id,
            email: mockDriver.email,
            firstName: mockDriver.firstName,
            lastName: mockDriver.lastName,
            userType: mockDriver.userType,
            isDriverActive: mockDriver.isDriverActive,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              userType: mockDriver.userType,
              isDriverActive: mockDriver.isDriverActive,
              updatedAt: new Date(),
            },
          });

        // Insert or update vehicle
        await db
          .insert(vehicles)
          .values({
            id: `vehicle-${mockDriver.id}`,
            driverId: mockDriver.id,
            make: mockDriver.vehicle.make,
            model: mockDriver.vehicle.model,
            year: mockDriver.vehicle.year,
            color: mockDriver.vehicle.color,
            licensePlate: mockDriver.vehicle.licensePlate,
            vehicleType: 'economy',
          })
          .onConflictDoUpdate({
            target: vehicles.id,
            set: {
              make: mockDriver.vehicle.make,
              model: mockDriver.vehicle.model,
              year: mockDriver.vehicle.year,
              color: mockDriver.vehicle.color,
              licensePlate: mockDriver.vehicle.licensePlate,
            },
          });
      } catch (error) {
        console.error(`Error creating mock driver ${mockDriver.id}:`, error);
      }
    }
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

  async updatePaymentMethod(id: string, paymentData: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    const [payment] = await db
      .update(paymentMethods)
      .set(paymentData)
      .where(eq(paymentMethods.id, id))
      .returning();
    return payment;
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
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

  async getPaymentHistory(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: payments.id,
        tripId: payments.tripId,
        paymentMethodId: payments.paymentMethodId,
        amount: payments.amount,
        status: payments.status,
        createdAt: payments.createdAt,
        processedAt: payments.processedAt,
        // Trip details
        tripPickupLocation: trips.pickupLocation,
        tripDestination: trips.destination,
        tripDistance: trips.distance,
        tripDuration: trips.duration,
        tripRequestedAt: trips.requestedAt,
        // Payment method details
        paymentMethodBrand: paymentMethods.brand,
        paymentMethodLastFour: paymentMethods.lastFour,
        paymentMethodType: paymentMethods.type,
      })
      .from(payments)
      .leftJoin(trips, eq(payments.tripId, trips.id))
      .leftJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));

    return result.map(row => ({
      id: row.id,
      tripId: row.tripId,
      paymentMethodId: row.paymentMethodId,
      amount: row.amount,
      status: row.status,
      createdAt: row.createdAt,
      processedAt: row.processedAt,
      trip: row.tripPickupLocation ? {
        pickupLocation: row.tripPickupLocation,
        destination: row.tripDestination,
        distance: row.tripDistance,
        duration: row.tripDuration,
        requestedAt: row.tripRequestedAt,
      } : null,
      paymentMethod: row.paymentMethodBrand ? {
        brand: row.paymentMethodBrand,
        lastFour: row.paymentMethodLastFour,
        type: row.paymentMethodType,
      } : null,
    }));
  }

  async processPayment(paymentData: { paymentMethodId: string; tripId: string; amount: number; userId: string }): Promise<{ paymentId: string; status: string }> {
    // Create payment record
    const [payment] = await db.insert(payments).values({
      tripId: paymentData.tripId,
      userId: paymentData.userId,
      paymentMethodId: paymentData.paymentMethodId,
      amount: paymentData.amount.toString(),
      status: 'completed' // For now, simulate successful payment
    }).returning();

    // Update trip with payment status
    await db
      .update(trips)
      .set({ finalPrice: paymentData.amount.toString() })
      .where(eq(trips.id, paymentData.tripId));

    return {
      paymentId: payment.id,
      status: 'completed'
    };
  }


  // Pricing Plan operations
  async ensurePricingPlans(): Promise<void> {
    // Check if pricing plans exist
    const existingPlans = await db.select().from(pricingPlans).limit(1);
    
    if (existingPlans.length > 0) {
      return; // Plans already exist
    }

    // Create default pricing plans
    const defaultPlans = [
      {
        name: 'driver-1',
        displayName: 'Economy',
        description: 'Affordable rides for everyday travel',
        vehicleType: 'economy',
        baseFare: '2.50',
        perMiRate: '2.01',
        perMinuteRate: '0.25',
        minimumFare: '5.00',
        cancellationFee: '3.00',
        bookingFee: '1.00',
        surgeMultiplier: 1.0,
        features: ['Standard vehicle', 'Reliable service', 'Budget-friendly'],
        icon: 'Car',
        color: '#3B82F6',
        maxPassengers: 4
      },
      {
        name: 'driver-2',
        displayName: 'Comfort',
        description: 'More spacious vehicles with extra comfort',
        vehicleType: 'comfort',
        baseFare: '3.50',
        perMiRate: '2.82',
        perMinuteRate: '0.35',
        minimumFare: '7.00',
        cancellationFee: '4.00',
        bookingFee: '1.50',
        surgeMultiplier: 1.2,
        features: ['Spacious interior', 'Climate control', 'Premium comfort'],
        icon: 'Car',
        color: '#10B981',
        maxPassengers: 4
      },
      {
        name: 'driver-3',
        displayName: 'Premium',
        description: 'Luxury vehicles for special occasions',
        vehicleType: 'premium',
        baseFare: '5.00',
        perMiRate: '4.02',
        perMinuteRate: '0.50',
        minimumFare: '12.00',
        cancellationFee: '6.00',
        bookingFee: '2.00',
        surgeMultiplier: 1.5,
        features: ['Luxury vehicle', 'Professional driver', 'Premium experience'],
        icon: 'Crown',
        color: '#8B5CF6',
        maxPassengers: 4
      }
    ];

    for (const planData of defaultPlans) {
      try {
        await db.insert(pricingPlans).values(planData);
      } catch (error) {
        console.error('Error creating pricing plan:', error);
      }
    }

    // Create sample promo codes
    const promoCodesData = [
      {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: '10% off your first ride',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: '15.00',
        minTripValue: '5.00',
        usageLimit: 1000,
        userLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      },
      {
        code: 'SAVE5',
        name: 'Save $5',
        description: 'Save $5 on rides over $20',
        discountType: 'fixed_amount',
        discountValue: 5,
        minTripValue: '20.00',
        usageLimit: 500,
        userLimit: 2,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      }
    ];

    for (const promoData of promoCodesData) {
      try {
        await db.insert(promoCodes).values(promoData);
      } catch (error) {
        console.error('Error creating promo code:', error);
      }
    }
  }

  async createPricingPlan(planData: InsertPricingPlan): Promise<PricingPlan> {
    const [plan] = await db.insert(pricingPlans).values(planData).returning();
    return plan;
  }

  async getPricingPlans(): Promise<PricingPlan[]> {
    return await db.select().from(pricingPlans).orderBy(pricingPlans.name);
  }

  async getActivePricingPlans(): Promise<PricingPlan[]> {
    return await db.select().from(pricingPlans).where(eq(pricingPlans.isActive, true)).orderBy(pricingPlans.name);
  }

  async getPricingPlan(id: string): Promise<PricingPlan | undefined> {
    const [plan] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, id));
    return plan;
  }

  async updatePricingPlan(id: string, planData: Partial<InsertPricingPlan>): Promise<PricingPlan> {
    const [plan] = await db
      .update(pricingPlans)
      .set({ ...planData, updatedAt: new Date() })
      .where(eq(pricingPlans.id, id))
      .returning();
    return plan;
  }

  async deletePricingPlan(id: string): Promise<void> {
    await db.delete(pricingPlans).where(eq(pricingPlans.id, id));
  }

  // Pricing Rule operations
  async createPricingRule(ruleData: InsertPricingRule): Promise<PricingRule> {
    const [rule] = await db.insert(pricingRules).values(ruleData).returning();
    return rule;
  }

  async getActivePricingRules(): Promise<PricingRule[]> {
    const now = new Date();
    return await db
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.isActive, true),
          sql`(${pricingRules.validFrom} IS NULL OR ${pricingRules.validFrom} <= ${now})`,
          sql`(${pricingRules.validTo} IS NULL OR ${pricingRules.validTo} >= ${now})`
        )
      )
      .orderBy(desc(pricingRules.priority));
  }

  async updatePricingRule(id: string, ruleData: Partial<InsertPricingRule>): Promise<PricingRule> {
    const [rule] = await db
      .update(pricingRules)
      .set(ruleData)
      .where(eq(pricingRules.id, id))
      .returning();
    return rule;
  }

  async deletePricingRule(id: string): Promise<void> {
    await db.delete(pricingRules).where(eq(pricingRules.id, id));
  }

  // Promo Code operations
  async createPromoCode(promoData: InsertPromoCode): Promise<PromoCode> {
    const [promo] = await db.insert(promoCodes).values(promoData).returning();
    return promo;
  }

  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    return promo;
  }

  async validatePromoCode(code: string, userId: string, tripValue: number): Promise<{ valid: boolean; discount?: number; reason?: string }> {
    const promo = await this.getPromoCode(code);
    
    if (!promo) {
      return { valid: false, reason: "Promo code not found" };
    }

    const now = new Date();
    
    // Check if promo is active and within valid dates
    if (!promo.isActive) {
      return { valid: false, reason: "Promo code is not active" };
    }
    
    if (now < promo.validFrom || now > promo.validTo) {
      return { valid: false, reason: "Promo code has expired" };
    }

    // Check minimum trip value
    if (promo.minTripValue && tripValue < parseFloat(promo.minTripValue)) {
      return { valid: false, reason: `Minimum trip value of $${promo.minTripValue} required` };
    }

    // Check usage limits
    if (promo.usageLimit && (promo.usedCount || 0) >= promo.usageLimit) {
      return { valid: false, reason: "Promo code usage limit exceeded" };
    }

    // Check user-specific usage limit
    const userUsage = await db
      .select()
      .from(userPromoUsage)
      .where(and(eq(userPromoUsage.userId, userId), eq(userPromoUsage.promoId, promo.id)));
    
    if (promo.userLimit && userUsage.length >= promo.userLimit) {
      return { valid: false, reason: "You have already used this promo code" };
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (tripValue * promo.discountValue) / 100;
      if (promo.maxDiscount && discount > parseFloat(promo.maxDiscount)) {
        discount = parseFloat(promo.maxDiscount);
      }
    } else {
      discount = promo.discountValue;
    }

    return { valid: true, discount };
  }

  async usePromoCode(promoId: string, userId: string, tripId: string, discountAmount: number): Promise<UserPromoUsage> {
    // Record usage
    const [usage] = await db
      .insert(userPromoUsage)
      .values({
        userId,
        promoId,
        tripId,
        discountAmount: discountAmount.toString(),
      })
      .returning();

    // Increment usage count
    await db
      .update(promoCodes)
      .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
      .where(eq(promoCodes.id, promoId));

    return usage;
  }

  // Enhanced pricing calculation
  async calculateTripPrice(params: {
    distance: number;
    duration: number;
    rideType: string;
    pickupTime: Date;
    pickupLat: number;
    pickupLng: number;
    promoCode?: string;
    userId: string;
  }) {
    // Get the pricing plan - all drivers use same pricing now
    const plans = await this.getActivePricingPlans();
    const plan = plans[0]; // use first available plan for all drivers

    if (!plan) {
      throw new Error("No pricing plan found");
    }

    // Base calculations
    const baseFare = parseFloat(plan.baseFare);
    const distanceCharge = params.distance * parseFloat(plan.perMiRate || '0');
    const timeCharge = 0; // Time charge removed from formula
    const bookingFee = parseFloat(plan.bookingFee || '0');
    
    let basePrice = baseFare + distanceCharge + bookingFee;
    
    // Apply minimum fare
    const minimumFare = parseFloat(plan.minimumFare);
    if (basePrice < minimumFare) {
      basePrice = minimumFare;
    }

    const adjustments: Array<{ type: string; amount: number; description: string }> = [];
    let finalPrice = basePrice;

    // Apply surge pricing based on time and location
    let surgeMultiplier = plan.surgeMultiplier || 1.0;
    const hour = params.pickupTime.getHours();
    
    // Peak hours surge (7-9 AM, 5-7 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      surgeMultiplier = Math.max(surgeMultiplier, 1.5);
      const surgeAmount = basePrice * (surgeMultiplier - 1);
      adjustments.push({
        type: 'surge',
        amount: surgeAmount,
        description: 'Peak hours surge pricing'
      });
      finalPrice += surgeAmount;
    }

    // Apply dynamic pricing rules
    const activeRules = await this.getActivePricingRules();
    for (const rule of activeRules) {
      // Check if rule applies to this plan
      if (rule.applicablePlans && rule.applicablePlans.length > 0 && !rule.applicablePlans.includes(plan.id)) {
        continue;
      }

      // Apply rule based on type
      let adjustment = 0;
      let description = rule.name;

      if (rule.adjustmentType === 'percentage') {
        adjustment = finalPrice * (rule.adjustmentValue / 100);
      } else if (rule.adjustmentType === 'fixed_amount') {
        adjustment = rule.adjustmentValue;
      } else if (rule.adjustmentType === 'multiplier') {
        adjustment = finalPrice * (rule.adjustmentValue - 1);
      }

      if (rule.type === 'discount') {
        adjustment = -Math.abs(adjustment);
      }

      adjustments.push({
        type: rule.type,
        amount: adjustment,
        description
      });

      finalPrice += adjustment;
    }

    // Apply promo code discount
    let promoDiscount = 0;
    if (params.promoCode) {
      const promoValidation = await this.validatePromoCode(params.promoCode, params.userId, finalPrice);
      if (promoValidation.valid && promoValidation.discount) {
        promoDiscount = promoValidation.discount;
        adjustments.push({
          type: 'discount',
          amount: -promoDiscount,
          description: `Promo code: ${params.promoCode}`
        });
        finalPrice -= promoDiscount;
      }
    }

    // Ensure final price is not negative
    finalPrice = Math.max(finalPrice, 0);

    return {
      basePrice,
      adjustments,
      finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
      breakdown: {
        baseFare,
        distanceCharge: Math.round(distanceCharge * 100) / 100,
        surgeFee: surgeMultiplier > 1 ? Math.round((basePrice * (surgeMultiplier - 1)) * 100) / 100 : undefined,
        bookingFee: bookingFee > 0 ? bookingFee : undefined,
        discount: promoDiscount > 0 ? Math.round(promoDiscount * 100) / 100 : undefined,
      }
    };
  }
}

export const storage = new DatabaseStorage();
