-- Add signature goal to support campaigns with progress target
ALTER TABLE public.petitions
ADD COLUMN IF NOT EXISTS signature_goal integer DEFAULT NULL;

-- Ensure goals are positive when defined
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'petitions_signature_goal_check'
    ) THEN
        ALTER TABLE public.petitions
        ADD CONSTRAINT petitions_signature_goal_check
        CHECK (signature_goal IS NULL OR signature_goal > 0);
    END IF;
END $$;

COMMENT ON COLUMN public.petitions.signature_goal
IS 'Meta de assinaturas para campanhas online (opcional). Quando preenchido, a aplicação pode usar para destacar e exibir progresso.';
