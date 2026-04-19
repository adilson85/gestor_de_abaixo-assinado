-- Require a signature goal whenever a petition is published online.
-- NOT VALID preserves existing legacy rows while enforcing the rule for new writes.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'petitions_online_requires_signature_goal_check'
    ) THEN
        ALTER TABLE public.petitions
        ADD CONSTRAINT petitions_online_requires_signature_goal_check
        CHECK (
            available_online = false
            OR signature_goal IS NOT NULL
        ) NOT VALID;
    END IF;
END $$;
