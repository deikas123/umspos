-- Create agent_transaction_meters junction table to store individual meter details per transaction
CREATE TABLE "agent_transaction_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"meter_id" uuid NOT NULL,
	"serial_number" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_transaction_meters" ADD CONSTRAINT "agent_transaction_meters_transaction_id_agent_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."agent_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_transaction_meters_transaction_id" ON "agent_transaction_meters" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_agent_transaction_meters_meter_id" ON "agent_transaction_meters" USING btree ("meter_id");