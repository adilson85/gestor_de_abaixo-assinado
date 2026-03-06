-- ============================================================================
-- FIX DEFINITIVO: POLÍTICAS RLS COM SINTAXE CORRETA
-- ============================================================================
-- O problema: auth.role() não funciona corretamente no Supabase
-- Solução: usar auth.uid() IS NOT NULL para verificar autenticação
-- ============================================================================

-- 1. PETITIONS - Corrigir políticas
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.petitions;

-- Permitir LEITURA para autenticados (qualquer petition)
CREATE POLICY "Authenticated users can read all petitions"
ON public.petitions
FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT para autenticados
CREATE POLICY "Authenticated users can insert petitions"
ON public.petitions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para autenticados
CREATE POLICY "Authenticated users can update petitions"
ON public.petitions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir DELETE para autenticados
CREATE POLICY "Authenticated users can delete petitions"
ON public.petitions
FOR DELETE
TO authenticated
USING (true);

-- 2. SIGNATURES - Corrigir políticas
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.signatures;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.signatures;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.signatures;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.signatures;

-- Permitir LEITURA para autenticados
CREATE POLICY "Authenticated users can read all signatures"
ON public.signatures
FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT para autenticados
CREATE POLICY "Authenticated users can insert signatures"
ON public.signatures
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para autenticados
CREATE POLICY "Authenticated users can update signatures"
ON public.signatures
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir DELETE para autenticados
CREATE POLICY "Authenticated users can delete signatures"
ON public.signatures
FOR DELETE
TO authenticated
USING (true);

-- 3. PETITION_RESOURCES - Corrigir políticas
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.petition_resources;

CREATE POLICY "Authenticated users can read resources"
ON public.petition_resources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert resources"
ON public.petition_resources
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update resources"
ON public.petition_resources
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete resources"
ON public.petition_resources
FOR DELETE
TO authenticated
USING (true);

-- 4. KANBAN_BOARDS - Corrigir políticas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_boards;

CREATE POLICY "Authenticated users can read boards"
ON public.kanban_boards
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert boards"
ON public.kanban_boards
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update boards"
ON public.kanban_boards
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete boards"
ON public.kanban_boards
FOR DELETE
TO authenticated
USING (true);

-- 5. KANBAN_COLUMNS - Corrigir políticas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_columns;

CREATE POLICY "Authenticated users can read columns"
ON public.kanban_columns
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert columns"
ON public.kanban_columns
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update columns"
ON public.kanban_columns
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete columns"
ON public.kanban_columns
FOR DELETE
TO authenticated
USING (true);

-- 6. KANBAN_TASKS - Corrigir políticas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_tasks;

CREATE POLICY "Authenticated users can read tasks"
ON public.kanban_tasks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert tasks"
ON public.kanban_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
ON public.kanban_tasks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
ON public.kanban_tasks
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT
  '=== RESUMO DAS POLÍTICAS ===' as info,
  schemaname,
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('petitions', 'signatures', 'petition_resources',
                    'kanban_boards', 'kanban_columns', 'kanban_tasks')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- DIFERENÇA CHAVE
-- ============================================================================
--
-- ANTES (não funcionava):
-- USING (auth.role() = 'authenticated')
--
-- AGORA (funciona):
-- TO authenticated + USING (true)
--
-- A diferença é usar o TARGET ROLE "authenticated" ao invés de verificar
-- auth.role() dentro da expressão USING. Essa é a sintaxe correta do Supabase!
-- ============================================================================
