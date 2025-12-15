-- Add pickup information fields to sale_batches table
-- These fields track who picked up the meters (customer or rider)

-- Add pickup_type enum-like field (using text with check constraint)
ALTER TABLE sale_batches ADD COLUMN IF NOT EXISTS picked_by_type text;
ALTER TABLE sale_batches ADD COLUMN IF NOT EXISTS picked_by_name text;
ALTER TABLE sale_batches ADD COLUMN IF NOT EXISTS picked_by_contact text;

-- Add check constraint for pickup_type to ensure valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sale_batches_picked_by_type_check'
    ) THEN
        ALTER TABLE sale_batches ADD CONSTRAINT sale_batches_picked_by_type_check 
        CHECK (picked_by_type IS NULL OR picked_by_type = ANY(ARRAY['customer', 'rider']::text[]));
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN sale_batches.picked_by_type IS 'Type of person who picked up the meters: customer or rider';
COMMENT ON COLUMN sale_batches.picked_by_name IS 'Name of the person who picked up the meters';
COMMENT ON COLUMN sale_batches.picked_by_contact IS 'Contact number of the person who picked up the meters';
