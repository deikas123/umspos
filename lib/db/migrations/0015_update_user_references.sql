-- Disable foreign key checks momentarily to allow type changes
GRANT ALL ON SCHEMA public TO public;

-- 1. Drop existing FKs pointing to user_profiles AND likely generic constraint names
ALTER TABLE "sale_batches" DROP CONSTRAINT IF EXISTS "sale_batches_user_id_user_profiles_id_fk";
ALTER TABLE "sale_batches" DROP CONSTRAINT IF EXISTS "sale_batches_user_id_fkey";

ALTER TABLE "sale_batches" DROP CONSTRAINT IF EXISTS "sale_batches_note_by_user_profiles_id_fk";
ALTER TABLE "sale_batches" DROP CONSTRAINT IF EXISTS "sale_batches_note_by_fkey";

ALTER TABLE "sales_transactions" DROP CONSTRAINT IF EXISTS "sales_transactions_user_id_user_profiles_id_fk";
ALTER TABLE "sales_transactions" DROP CONSTRAINT IF EXISTS "sales_transactions_user_id_fkey";

ALTER TABLE "sold_meters" DROP CONSTRAINT IF EXISTS "sold_meters_sold_by_user_profiles_id_fk";
ALTER TABLE "sold_meters" DROP CONSTRAINT IF EXISTS "sold_meters_sold_by_fkey";
-- Added based on error:
ALTER TABLE "sold_meters" DROP CONSTRAINT IF EXISTS "sold_meters_replacement_by_fkey";
ALTER TABLE "sold_meters" DROP CONSTRAINT IF EXISTS "sold_meters_replacement_by_user_profiles_id_fk";

ALTER TABLE "client_prospects" DROP CONSTRAINT IF EXISTS "client_prospects_sales_person_id_user_profiles_id_fk";
ALTER TABLE "client_prospects" DROP CONSTRAINT IF EXISTS "client_prospects_sales_person_id_fkey";


-- Drop potential constraints on other columns being converted
ALTER TABLE "meter_purchase_batches" DROP CONSTRAINT IF EXISTS "meter_purchase_batches_added_by_fkey";
ALTER TABLE "meter_purchase_batches" DROP CONSTRAINT IF EXISTS "meter_purchase_batches_added_by_user_profiles_id_fk";

ALTER TABLE "faulty_returns" DROP CONSTRAINT IF EXISTS "faulty_returns_returned_by_fkey";
ALTER TABLE "faulty_returns" DROP CONSTRAINT IF EXISTS "faulty_returns_returned_by_user_profiles_id_fk";

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_created_by_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_created_by_user_profiles_id_fk";

ALTER TABLE "meters" DROP CONSTRAINT IF EXISTS "meters_added_by_fkey";
ALTER TABLE "meters" DROP CONSTRAINT IF EXISTS "meters_added_by_user_profiles_id_fk";

-- Also need to handle 'two_factor' if it exists and references user
ALTER TABLE "two_factor" DROP CONSTRAINT IF EXISTS "two_factor_user_id_check"; -- Just in case
ALTER TABLE "two_factor" DROP CONSTRAINT IF EXISTS "two_factor_user_id_fkey";
-- Note: Drizzle usually names it two_factor_user_id_user_id_fk if explicitly generated, but helpful to be safe

-- 1b. (Removed based on user confirmation that user table is already correct)

-- 2. Convert Reference Columns from UUID to TEXT
-- We use explicit casting to ensure data is preserved as string representation of UUID
ALTER TABLE "sale_batches" ALTER COLUMN "user_id" TYPE text USING "user_id"::text;
ALTER TABLE "sale_batches" ALTER COLUMN "note_by" TYPE text USING "note_by"::text;

ALTER TABLE "sales_transactions" ALTER COLUMN "user_id" TYPE text USING "user_id"::text;

ALTER TABLE "sold_meters" ALTER COLUMN "sold_by" TYPE text USING "sold_by"::text;
ALTER TABLE "sold_meters" ALTER COLUMN "replacement_by" TYPE text USING "replacement_by"::text;

ALTER TABLE "client_prospects" ALTER COLUMN "sales_person_id" TYPE text USING "sales_person_id"::text;

-- Update other tables that might have been referencing uuid but didn't have explicit foreign keys causing hard errors yet,
-- but need to be text to match the new schema definitions.
ALTER TABLE "meter_purchase_batches" ALTER COLUMN "added_by" TYPE text USING "added_by"::text;
ALTER TABLE "faulty_returns" ALTER COLUMN "returned_by" TYPE text USING "returned_by"::text;
ALTER TABLE "notifications" ALTER COLUMN "created_by" TYPE text USING "created_by"::text;
-- notifications.read_by is uuid[] -> text[]
ALTER TABLE "notifications" ALTER COLUMN "read_by" TYPE text[] USING "read_by"::text[];
ALTER TABLE "meters" ALTER COLUMN "added_by" TYPE text USING "added_by"::text;


-- 3. Add new Foreign Keys pointing to the 'user' table (BetterAuth)
-- NOTE: If existing user_ids in these tables do not exist in the 'user' table, these commands will fail.
-- You may need to clean up data or insert migration users into 'user' table first if that happens.

DO $$ BEGIN
    ALTER TABLE "sale_batches" 
        ADD CONSTRAINT "sale_batches_user_id_user_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sale_batches" 
        ADD CONSTRAINT "sale_batches_note_by_user_id_fk" 
        FOREIGN KEY ("note_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sales_transactions" 
        ADD CONSTRAINT "sales_transactions_user_id_user_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sold_meters" 
        ADD CONSTRAINT "sold_meters_sold_by_user_id_fk" 
        FOREIGN KEY ("sold_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "client_prospects" 
        ADD CONSTRAINT "client_prospects_sales_person_id_user_id_fk" 
        FOREIGN KEY ("sales_person_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Drop the legacy user_profiles table entirely
-- COMMENTED OUT FOR SAFETY: Uncomment this only when you are sure all data is migrated and the new setup works.
-- DROP TABLE IF EXISTS "user_profiles";
