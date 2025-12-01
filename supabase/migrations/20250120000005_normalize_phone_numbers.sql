-- Migration: Normalizar números de telefone existentes
-- Remove formatação (parênteses, espaços, hífens) dos telefones salvos
-- para garantir consistência na verificação de duplicatas

-- Atualizar todos os telefones removendo caracteres não numéricos
UPDATE public.signatures
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
WHERE phone ~ '[^0-9]';

-- Comentário: Esta migration normaliza telefones que foram salvos com formatação
-- Ex: "(47) 99999-9999" -> "47999999999"


