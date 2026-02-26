CREATE INDEX "idx_agent_inventory_serial_number_trgm" ON "agent_inventory" USING gin ("serial_number" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_faulty_returns_serial_number_trgm" ON "faulty_returns" USING gin ("serial_number" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_meters_serial_number_trgm" ON "meters" USING gin ("serial_number" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_sold_meters_serial_number_trgm" ON "sold_meters" USING gin ("serial_number" gin_trgm_ops);