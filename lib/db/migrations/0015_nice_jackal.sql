ALTER TABLE "agent_transactions" ADD COLUMN "performed_by" text;--> statement-breakpoint
ALTER TABLE "agent_transactions" ADD COLUMN "performed_by_name" text;--> statement-breakpoint
ALTER TABLE "agent_transactions" ADD CONSTRAINT "agent_transactions_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;