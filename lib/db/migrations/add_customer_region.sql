-- Add customer_region column to sale_batches, sales_transactions, and sold_meters tables
-- Run this migration to add the region field to existing database tables

-- Add customer_region to sale_batches
ALTER TABLE sale_batches ADD COLUMN IF NOT EXISTS customer_region text;

-- Add customer_region to sales_transactions
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS customer_region text;

-- Add customer_region to sold_meters
ALTER TABLE sold_meters ADD COLUMN IF NOT EXISTS customer_region text;

-- Backfill customer_region based on customer_county for all tables

-- Central Region
UPDATE sale_batches SET customer_region = 'Central' WHERE customer_county IN ('Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang''a', 'Kiambu') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Central' WHERE customer_county IN ('Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang''a', 'Kiambu') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Central' WHERE customer_county IN ('Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang''a', 'Kiambu') AND customer_region IS NULL;

-- Coast Region
UPDATE sale_batches SET customer_region = 'Coast' WHERE customer_county IN ('Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Coast' WHERE customer_county IN ('Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Coast' WHERE customer_county IN ('Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta') AND customer_region IS NULL;

-- North Eastern Region
UPDATE sale_batches SET customer_region = 'North Eastern' WHERE customer_county IN ('Garissa', 'Wajir', 'Mandera') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'North Eastern' WHERE customer_county IN ('Garissa', 'Wajir', 'Mandera') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'North Eastern' WHERE customer_county IN ('Garissa', 'Wajir', 'Mandera') AND customer_region IS NULL;

-- Eastern Region
UPDATE sale_batches SET customer_region = 'Eastern' WHERE customer_county IN ('Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Eastern' WHERE customer_county IN ('Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Eastern' WHERE customer_county IN ('Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni') AND customer_region IS NULL;

-- Rift Valley Region
UPDATE sale_batches SET customer_region = 'Rift Valley' WHERE customer_county IN ('Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Rift Valley' WHERE customer_county IN ('Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Rift Valley' WHERE customer_county IN ('Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet') AND customer_region IS NULL;

-- Western Region
UPDATE sale_batches SET customer_region = 'Western' WHERE customer_county IN ('Kakamega', 'Vihiga', 'Bungoma', 'Busia') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Western' WHERE customer_county IN ('Kakamega', 'Vihiga', 'Bungoma', 'Busia') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Western' WHERE customer_county IN ('Kakamega', 'Vihiga', 'Bungoma', 'Busia') AND customer_region IS NULL;

-- Nyanza Region
UPDATE sale_batches SET customer_region = 'Nyanza' WHERE customer_county IN ('Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira') AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Nyanza' WHERE customer_county IN ('Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira') AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Nyanza' WHERE customer_county IN ('Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira') AND customer_region IS NULL;

-- Nairobi Region
UPDATE sale_batches SET customer_region = 'Nairobi' WHERE customer_county = 'Nairobi' AND customer_region IS NULL;
UPDATE sales_transactions SET customer_region = 'Nairobi' WHERE customer_county = 'Nairobi' AND customer_region IS NULL;
UPDATE sold_meters SET customer_region = 'Nairobi' WHERE customer_county = 'Nairobi' AND customer_region IS NULL;
