ALTER TABLE "user_profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_profiles" CASCADE;--> statement-breakpoint
ALTER TABLE "sale_batches" DROP CONSTRAINT "sale_batches_user_id_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_batches" DROP CONSTRAINT "sale_batches_note_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "sales_transactions" DROP CONSTRAINT "sales_transactions_user_id_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "sold_meters" DROP CONSTRAINT "sold_meters_sold_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "faulty_returns" ALTER COLUMN "returned_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "meter_purchase_batches" ALTER COLUMN "added_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "meters" ALTER COLUMN "added_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "read_by" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "sale_batches" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sale_batches" ALTER COLUMN "note_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sales_transactions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sold_meters" ALTER COLUMN "sold_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sold_meters" ALTER COLUMN "replacement_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sale_batches" ADD CONSTRAINT "sale_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_batches" ADD CONSTRAINT "sale_batches_note_by_user_id_fk" FOREIGN KEY ("note_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sold_meters" ADD CONSTRAINT "sold_meters_sold_by_user_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sale_batches_recipient_trgm" ON "sale_batches" USING gin ("recipient" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_sale_batches_user_name_trgm" ON "sale_batches" USING gin ("user_name" gin_trgm_ops);