-- Performance indexes for frequently queried columns
-- Safe to run on production - CREATE INDEX IF NOT EXISTS prevents errors

-- Sale batches indexes (high-traffic table)
CREATE INDEX IF NOT EXISTS idx_sale_batches_sale_date ON sale_batches(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sale_batches_meter_type ON sale_batches(meter_type);
CREATE INDEX IF NOT EXISTS idx_sale_batches_customer_type ON sale_batches(customer_type);
CREATE INDEX IF NOT EXISTS idx_sale_batches_user_id ON sale_batches(user_id);

-- Sold meters indexes
CREATE INDEX IF NOT EXISTS idx_sold_meters_serial_number ON sold_meters(serial_number);
CREATE INDEX IF NOT EXISTS idx_sold_meters_batch_id ON sold_meters(batch_id);
CREATE INDEX IF NOT EXISTS idx_sold_meters_sold_at ON sold_meters(sold_at DESC);

-- Agent inventory indexes (for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_agent_inventory_agent_id ON agent_inventory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_inventory_meter_id ON agent_inventory(meter_id);

-- Meters indexes
CREATE INDEX IF NOT EXISTS idx_meters_type ON meters(type);
CREATE INDEX IF NOT EXISTS idx_meters_serial_number ON meters(serial_number);
CREATE INDEX IF NOT EXISTS idx_meters_batch_id ON meters(batch_id);

-- Notifications indexes (for bell queries)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Faulty returns indexes
CREATE INDEX IF NOT EXISTS idx_faulty_returns_status ON faulty_returns(status);
CREATE INDEX IF NOT EXISTS idx_faulty_returns_serial_number ON faulty_returns(serial_number);

-- Agent transactions indexes
CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent_id ON agent_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_transaction_date ON agent_transactions(transaction_date DESC);

-- Prospects indexes
CREATE INDEX IF NOT EXISTS idx_client_prospects_sales_person_id ON client_prospects(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_client_prospects_status ON client_prospects(status);
CREATE INDEX IF NOT EXISTS idx_client_prospects_created_at ON client_prospects(created_at DESC);

-- Update requests indexes
CREATE INDEX IF NOT EXISTS idx_sale_batch_update_requests_status ON sale_batch_update_requests(status);
CREATE INDEX IF NOT EXISTS idx_sale_batch_update_requests_sale_batch_id ON sale_batch_update_requests(sale_batch_id);
