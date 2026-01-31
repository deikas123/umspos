
ALTER TABLE "faulty_returns" ADD COLUMN "is_binned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "faulty_returns" ADD COLUMN "binned_at" timestamp;--> statement-breakpoint
ALTER TABLE "faulty_returns" ADD COLUMN "binned_by" text;--> statement-breakpoint
ALTER TABLE "faulty_returns" ADD COLUMN "binned_by_name" text;--> statement-breakpoint