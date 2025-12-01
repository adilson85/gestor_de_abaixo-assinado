-- Migration: Garantir inserção pública de assinaturas e prevenir duplicatas
-- Esta migration garante que usuários não autenticados possam inserir assinaturas
-- e adiciona constraint para prevenir assinaturas duplicadas no banco de dados

-- Remover política antiga se existir (para evitar duplicatas)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.signatures;
DROP POLICY IF EXISTS "Enable public insert for signatures" ON public.signatures;

-- Criar política que permite inserção pública de assinaturas
-- Isso é necessário para permitir que usuários não autenticados assinem abaixo-assinados online
CREATE POLICY "Enable public insert for signatures" 
ON public.signatures 
FOR INSERT 
TO public
WITH CHECK (true);

-- Comentário explicativo
COMMENT ON POLICY "Enable public insert for signatures" ON public.signatures IS 
'Permite inserção pública de assinaturas para que usuários não autenticados possam assinar abaixo-assinados online';

-- ============================================
-- PREVENIR ASSINATURAS DUPLICADAS
-- ============================================
-- Adicionar constraint UNIQUE para prevenir que o mesmo telefone assine
-- o mesmo abaixo-assinado mais de uma vez (mesmo que alguém tente contornar a validação do código)

-- PRIMEIRO: Remover duplicatas existentes
-- Mantém apenas a primeira assinatura (mais antiga) de cada combinação (petition_id, phone)
-- Isso é necessário antes de criar a constraint UNIQUE, caso já existam duplicatas no banco

-- Método 1: Usando subquery (funciona na maioria dos casos)
DELETE FROM public.signatures
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY petition_id, phone 
             ORDER BY created_at ASC
           ) as row_num
    FROM public.signatures
  ) ranked
  WHERE ranked.row_num > 1
);

-- Se o método acima falhar, use esta alternativa (descomente e comente o método acima):
-- CREATE TEMP TABLE signatures_to_delete AS
-- SELECT id
-- FROM (
--   SELECT id,
--          ROW_NUMBER() OVER (
--            PARTITION BY petition_id, phone 
--            ORDER BY created_at ASC
--          ) as row_num
--   FROM public.signatures
-- ) ranked
-- WHERE ranked.row_num > 1;
-- 
-- DELETE FROM public.signatures
-- WHERE id IN (SELECT id FROM signatures_to_delete);
-- 
-- DROP TABLE signatures_to_delete;

-- Remover constraint antiga se existir
ALTER TABLE public.signatures 
DROP CONSTRAINT IF EXISTS signatures_petition_id_phone_key;

-- Criar constraint UNIQUE para (petition_id, phone)
-- Isso garante que não haverá duplicatas mesmo se alguém tentar inserir diretamente no banco
ALTER TABLE public.signatures 
ADD CONSTRAINT signatures_petition_id_phone_key UNIQUE (petition_id, phone);

-- Comentário explicativo
COMMENT ON CONSTRAINT signatures_petition_id_phone_key ON public.signatures IS 
'Garante que o mesmo telefone não pode assinar o mesmo abaixo-assinado mais de uma vez';

