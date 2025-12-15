-- Add agent_type field to agents table
-- Agent type can be 'cash' or 'credit'

ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_type text NOT NULL DEFAULT 'cash';

-- Add check constraint for agent_type to ensure valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'agents_agent_type_check'
    ) THEN
        ALTER TABLE agents ADD CONSTRAINT agents_agent_type_check 
        CHECK (agent_type = ANY(ARRAY['cash', 'credit']::text[]));
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN agents.agent_type IS 'Type of agent payment terms: cash or credit';
