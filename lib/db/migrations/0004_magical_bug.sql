CREATE TYPE "public"."prospect_status" AS ENUM('interested', 'not_interested', 'prospect', 'lead', 'presentation', 'quotation_sent', 'closed', 'lost');--> statement-breakpoint
CREATE TABLE "client_prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_person_id" text NOT NULL,
	"sales_person_name" text NOT NULL,
	"client_name" text NOT NULL,
	"location" text NOT NULL,
	"contact" text NOT NULL,
	"status" "prospect_status" DEFAULT 'prospect' NOT NULL,
	"other_remarks" text,
	"meter_type" text NOT NULL,
	"number_of_meters" integer DEFAULT 1 NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"change_history" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
ALTER TABLE "client_prospects" ADD CONSTRAINT "client_prospects_sales_person_id_user_id_fk" FOREIGN KEY ("sales_person_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;