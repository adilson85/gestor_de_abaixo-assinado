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

