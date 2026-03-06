-- ============================================================================
-- FIX: POLÍTICAS DE STORAGE PARA IMAGENS DAS PETITIONS
-- ============================================================================
-- Este script configura o bucket petition-images e suas políticas de acesso
-- para permitir que imagens sejam exibidas publicamente
-- ============================================================================

-- 1. GARANTIR QUE O BUCKET EXISTE E É PÚBLICO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'petition-images',
  'petition-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. REMOVER POLÍTICAS ANTIGAS SE EXISTIREM
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;

-- Também remover políticas com nomes diferentes
DROP POLICY IF EXISTS "Public read for petition images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload petition images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update petition images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete petition images" ON storage.objects;

-- 3. CRIAR POLÍTICAS NOVAS

-- Permitir upload de imagens para usuários autenticados
CREATE POLICY "Authenticated users can upload petition images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'petition-images');

-- Permitir LEITURA PÚBLICA das imagens (ESSENCIAL!)
CREATE POLICY "Public read for petition images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'petition-images');

-- Permitir atualização para usuários autenticados
CREATE POLICY "Authenticated users can update petition images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'petition-images');

-- Permitir exclusão para usuários autenticados
CREATE POLICY "Authenticated users can delete petition images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'petition-images');

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON POLICY "Public read for petition images" ON storage.objects IS
'Permite que qualquer pessoa (incluindo visitantes não autenticados) vejam as imagens dos abaixo-assinados';

COMMENT ON POLICY "Authenticated users can upload petition images" ON storage.objects IS
'Permite que administradores façam upload de imagens ao cadastrar abaixo-assinados';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Ver configuração do bucket
SELECT
  '=== BUCKET CONFIG ===' as info,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'petition-images';

-- Ver políticas de storage
SELECT
  '=== STORAGE POLICIES ===' as info,
  policyname,
  cmd as operacao,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%petition%'
ORDER BY policyname;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. O bucket DEVE ser público (public = true) para imagens aparecerem
-- 2. A política "Public read" é ESSENCIAL para páginas públicas
-- 3. URLs das imagens seguem o formato:
--    https://[PROJECT_REF].supabase.co/storage/v1/object/public/petition-images/[FILE_NAME]
--
-- 4. Se a imagem ainda não aparecer, verifique:
--    - A URL está correta?
--    - O arquivo foi realmente enviado?
--    - Não há CORS bloqueando?
-- ============================================================================
