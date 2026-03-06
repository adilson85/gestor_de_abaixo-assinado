-- ============================================================================
-- FIX: POLÍTICAS RLS PARA USUÁRIOS AUTENTICADOS (PORTAL ADM)
-- ============================================================================
-- Este script adiciona políticas para permitir que usuários AUTENTICADOS
-- tenham acesso completo às tabelas petitions e signatures
-- (as políticas públicas que você criou continuam funcionando!)
-- ============================================================================

-- 1. PETITIONS - Adicionar acesso completo para usuários autenticados
-- Remover política antiga se existir
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.petitions;

-- Criar política que permite TODOS os acessos para autenticados
CREATE POLICY "Enable full access for authenticated users"
ON public.petitions
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Enable full access for authenticated users" ON public.petitions IS
'Permite acesso completo às petitions para usuários autenticados (portal administrativo)';

-- 2. SIGNATURES - Adicionar acesso completo para usuários autenticados
-- Remover política antiga se existir
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.signatures;

-- Criar política que permite TODOS os acessos para autenticados
CREATE POLICY "Enable full access for authenticated users"
ON public.signatures
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Enable full access for authenticated users" ON public.signatures IS
'Permite acesso completo às signatures para usuários autenticados (portal administrativo)';

-- 3. PETITION_RESOURCES - Adicionar acesso para usuários autenticados
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.petition_resources;

CREATE POLICY "Enable full access for authenticated users"
ON public.petition_resources
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Enable full access for authenticated users" ON public.petition_resources IS
'Permite acesso completo aos recursos das petitions para usuários autenticados';

-- 4. ADMIN_USERS - Adicionar acesso para usuários autenticados
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.admin_users;

CREATE POLICY "Enable full access for authenticated users"
ON public.admin_users
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICAÇÃO - RESUMO DAS POLÍTICAS
-- ============================================================================

-- Ver políticas de petitions
SELECT
  '=== PETITIONS ===' as info,
  policyname,
  cmd as operacao,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'petitions'
ORDER BY policyname;

-- Ver políticas de signatures
SELECT
  '=== SIGNATURES ===' as info,
  policyname,
  cmd as operacao,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'signatures'
ORDER BY policyname;

-- ============================================================================
-- EXPLICAÇÃO
-- ============================================================================
--
-- AGORA VOCÊ TEM 2 NÍVEIS DE ACESSO:
--
-- 📖 PÚBLICO (não autenticado):
--    ✅ petitions: Ler petitions com available_online = true
--    ✅ signatures: Inserir novas assinaturas
--    ✅ signatures: Ler assinaturas (para contagem)
--    → Permite que qualquer pessoa assine online!
--
-- 🔐 AUTENTICADO (portal ADM):
--    ✅ petitions: Acesso completo (ler, inserir, editar, deletar)
--    ✅ signatures: Acesso completo (ler, inserir, editar, deletar)
--    ✅ petition_resources: Acesso completo
--    ✅ admin_users: Acesso completo
--    → Permite que administradores gerenciem tudo!
--
-- As políticas trabalham em conjunto - Supabase aplica a que for verdadeira!
-- ============================================================================
