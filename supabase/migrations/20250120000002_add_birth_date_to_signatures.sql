-- Migration: Adicionar campo de data de nascimento na tabela signatures
-- Apenas para assinaturas online

-- Adicionar coluna birth_date (opcional)
ALTER TABLE signatures
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Comentário explicativo
COMMENT ON COLUMN signatures.birth_date IS 'Data de nascimento do signatário (opcional, apenas para assinaturas online)';


