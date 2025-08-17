CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" varchar,
	"user_id" varchar,
	"payment_method_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" varchar,
	"failure_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "ride_type" SET DEFAULT 'driver-1';--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "vehicle_type" SET DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "card_number" varchar;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "expiry_month" integer;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "expiry_year" integer;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "cardholder_name" varchar;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "billing_address" jsonb;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "stripe_payment_method_id" varchar;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;