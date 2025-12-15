CREATE TYPE "public"."update_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "sale_batch_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_batch_id" uuid NOT NULL,
	"action" text NOT NULL,
	"performed_by" text NOT NULL,
	"performed_by_name" text NOT NULL,
	"performed_at" timestamp DEFAULT now(),
	"old_values" jsonb,
	"new_values" jsonb,
	"update_request_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "sale_batch_update_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_batch_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"requested_by_name" text NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"status" "update_request_status" DEFAULT 'pending',
	"approved_by" text,
	"approved_by_name" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"update_reason" text NOT NULL,
	"changes" jsonb NOT NULL,
	"new_sale_date" timestamp,
	"new_unit_price" numeric(10, 2),
	"new_total_price" numeric(10, 2)
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "read_by" SET DATA TYPE uuid[];--> statement-breakpoint
ALTER TABLE "sale_batch_audit_log" ADD CONSTRAINT "sale_batch_audit_log_sale_batch_id_sale_batches_id_fk" FOREIGN KEY ("sale_batch_id") REFERENCES "public"."sale_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_batch_audit_log" ADD CONSTRAINT "sale_batch_audit_log_update_request_id_sale_batch_update_requests_id_fk" FOREIGN KEY ("update_request_id") REFERENCES "public"."sale_batch_update_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_batch_update_requests" ADD CONSTRAINT "sale_batch_update_requests_sale_batch_id_sale_batches_id_fk" FOREIGN KEY ("sale_batch_id") REFERENCES "public"."sale_batches"("id") ON DELETE cascade ON UPDATE no action;