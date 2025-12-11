CREATE TYPE "public"."faulty_meter_status" AS ENUM('pending', 'repaired', 'unrepairable');--> statement-breakpoint
CREATE TYPE "public"."meter_status" AS ENUM('active', 'replaced', 'faulty');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('METER_SALE', 'AGENT_ASSIGNMENT', 'METER_RETURN', 'FAULTY_METER', 'SYSTEM_UPDATE');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('assignment', 'return');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'accountant', 'user');--> statement-breakpoint
CREATE TABLE "agent_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"meter_id" uuid NOT NULL,
	"serial_number" text NOT NULL,
	"type" text NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"transaction_type" "transaction_type" NOT NULL,
	"meter_type" text NOT NULL,
	"quantity" integer DEFAULT 1,
	"transaction_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"location" text NOT NULL,
	"county" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "agents_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" timestamp,
	"isAnonymous" boolean,
	"phoneNumber" text,
	"phoneNumberVerified" boolean,
	"twoFactorEnabled" boolean,
	"displayName" text,
	"appRole" text DEFAULT 'user',
	"isActive" boolean DEFAULT true,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phoneNumber_unique" UNIQUE("phoneNumber")
);
--> statement-breakpoint
CREATE TABLE "faulty_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" text NOT NULL,
	"type" text NOT NULL,
	"returned_by" text NOT NULL,
	"returned_at" timestamp DEFAULT now(),
	"returner_name" text NOT NULL,
	"fault_description" text,
	"status" "faulty_meter_status" DEFAULT 'pending',
	"original_sale_id" text
);
--> statement-breakpoint
CREATE TABLE "meter_purchase_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"added_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"batch_number" text NOT NULL,
	CONSTRAINT "meter_purchase_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" text NOT NULL,
	"type" text NOT NULL,
	"added_by" uuid NOT NULL,
	"added_at" timestamp DEFAULT now(),
	"adder_name" text NOT NULL,
	"batch_id" uuid,
	CONSTRAINT "meters_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"is_read" boolean DEFAULT false,
	"read_by" text[]
);
--> statement-breakpoint
CREATE TABLE "sale_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" text NOT NULL,
	"meter_type" text NOT NULL,
	"batch_amount" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"destination" text NOT NULL,
	"recipient" text NOT NULL,
	"customer_type" text,
	"customer_region" text,
	"customer_county" text,
	"customer_contact" text,
	"sale_date" timestamp DEFAULT now(),
	"transaction_id" uuid,
	"notes" text,
	"note_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sales_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"sale_date" timestamp DEFAULT now(),
	"destination" text NOT NULL,
	"recipient" text NOT NULL,
	"customer_type" text,
	"customer_region" text,
	"customer_county" text,
	"customer_contact" text,
	"reference_number" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	CONSTRAINT "sales_transactions_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "sold_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" text,
	"serial_number" text NOT NULL,
	"sold_by" text NOT NULL,
	"sold_at" timestamp DEFAULT now(),
	"destination" text NOT NULL,
	"recipient" text NOT NULL,
	"customer_type" text,
	"customer_region" text,
	"customer_county" text,
	"customer_contact" text,
	"unit_price" numeric(10, 2) NOT NULL,
	"batch_id" text NOT NULL,
	"status" "meter_status" DEFAULT 'active',
	"replacement_serial" text,
	"replacement_date" timestamp,
	"replacement_by" text
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"role" "user_role" DEFAULT 'user',
	"is_active" boolean DEFAULT true,
	"push_enabled" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "agent_inventory" ADD CONSTRAINT "agent_inventory_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_transactions" ADD CONSTRAINT "agent_transactions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faulty_returns" ADD CONSTRAINT "faulty_returns_original_sale_id_sold_meters_id_fk" FOREIGN KEY ("original_sale_id") REFERENCES "public"."sold_meters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_batch_id_meter_purchase_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."meter_purchase_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_batches" ADD CONSTRAINT "sale_batches_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_batches" ADD CONSTRAINT "sale_batches_transaction_id_sales_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."sales_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_batches" ADD CONSTRAINT "sale_batches_note_by_user_profiles_id_fk" FOREIGN KEY ("note_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sold_meters" ADD CONSTRAINT "sold_meters_batch_id_sale_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."sale_batches"("id") ON DELETE cascade ON UPDATE no action;