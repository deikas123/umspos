ALTER TABLE "agent_transactions" ALTER COLUMN "transaction_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "faulty_returns" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "faulty_returns" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sold_meters" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sold_meters" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
DROP TYPE "public"."faulty_meter_status";--> statement-breakpoint
DROP TYPE "public"."meter_status";--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
DROP TYPE "public"."transaction_type";