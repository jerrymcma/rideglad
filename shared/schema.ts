import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  boolean,
  text,
  real
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  userType: varchar("user_type").notNull().default("rider"), // 'rider' or 'driver'
  rating: real("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  isDriverActive: boolean("is_driver_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => users.id),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  color: varchar("color").notNull(),
  licensePlate: varchar("license_plate").notNull(),
  vehicleType: varchar("vehicle_type").notNull().default("economy"), // 'economy', 'comfort', 'premium'
  createdAt: timestamp("created_at").defaultNow(),
});

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  riderId: varchar("rider_id").references(() => users.id),
  driverId: varchar("driver_id").references(() => users.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  pickupAddress: text("pickup_address").notNull(),
  pickupLat: real("pickup_lat").notNull(),
  pickupLng: real("pickup_lng").notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationLat: real("destination_lat").notNull(),
  destinationLng: real("destination_lng").notNull(),
  status: varchar("status").notNull().default("requested"), // 'requested', 'matched', 'pickup', 'in_progress', 'completed', 'cancelled'
  rideType: varchar("ride_type").notNull().default("economy"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  distance: real("distance"), // in kilometers
  duration: integer("duration"), // in minutes
  requestedAt: timestamp("requested_at").defaultNow(),
  matchedAt: timestamp("matched_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // 'card', 'paypal', etc.
  lastFour: varchar("last_four"),
  brand: varchar("brand"), // 'visa', 'mastercard', etc.
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ridesAsRider: many(trips, { relationName: "riderTrips" }),
  ridesAsDriver: many(trips, { relationName: "driverTrips" }),
  vehicles: many(vehicles),
  ratingsGiven: many(ratings, { relationName: "ratingsGiven" }),
  ratingsReceived: many(ratings, { relationName: "ratingsReceived" }),
  paymentMethods: many(paymentMethods),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  driver: one(users, {
    fields: [vehicles.driverId],
    references: [users.id],
  }),
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  rider: one(users, {
    fields: [trips.riderId],
    references: [users.id],
    relationName: "riderTrips",
  }),
  driver: one(users, {
    fields: [trips.driverId],
    references: [users.id],
    relationName: "driverTrips",
  }),
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  trip: one(trips, {
    fields: [ratings.tripId],
    references: [trips.id],
  }),
  fromUser: one(users, {
    fields: [ratings.fromUserId],
    references: [users.id],
    relationName: "ratingsGiven",
  }),
  toUser: one(users, {
    fields: [ratings.toUserId],
    references: [users.id],
    relationName: "ratingsReceived",
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  requestedAt: true,
  matchedAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
