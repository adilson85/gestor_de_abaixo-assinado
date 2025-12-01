-- Migration: Garantir inserção pública de assinaturas
-- Esta migration garante que usuários não autenticados possam inserir assinaturas
-- (necessário para assinaturas online públicas)

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

