-- =====================================================
-- MIGRATION: Corrigir RLS policies de admin_users
-- Data: 2025-01-21
-- Descrição: Corrige falha de segurança CRÍTICA!
-- PROBLEMA ATUAL: QUALQUER usuário autenticado pode CRUD admin_users
-- SOLUÇÃO: Apenas admins existentes podem modificar a tabela
-- =====================================================

-- IMPORTANTE: Esta migration corrige o problema de segurança atual!
-- Atualmente QUALQUER usuário autenticado pode modificar admin_users

-- Remover policies antigas (inseguras)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.admin_users;

-- =====================================================
-- CRIAR NOVAS POLICIES SEGURAS
-- =====================================================

-- SELECT: Qualquer usuário autenticado pode VER a lista de admins
-- (Necessário para a UI mostrar a lista no Settings)
CREATE POLICY "Authenticated users can read admin list" ON public.admin_users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- INSERT: Apenas admins existentes OU service role podem adicionar novos admins
-- Service role é necessário para Edge Functions que usam a service_role_key
CREATE POLICY "Only admins can add new admins" ON public.admin_users
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- UPDATE: Apenas admins existentes podem atualizar registros
CREATE POLICY "Only admins can update admin records" ON public.admin_users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- DELETE: Apenas admins existentes podem remover outros admins
-- Proteção contra auto-remoção é validada na aplicação/Edge Function
CREATE POLICY "Only admins can delete admin records" ON public.admin_users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- =====================================================
-- CRIAR FUNÇÃO HELPER PARA VERIFICAR ADMIN
-- =====================================================

-- Criar função helper para verificar se user é admin (útil para outras queries)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = $1
        AND admin_users.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION public.is_admin IS 'Verifica se um user_id é administrador ativo. SECURITY DEFINER permite bypass de RLS.';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'admin_users';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Policies configuradas: %', policy_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies criadas:';
    FOR policy_count IN
        SELECT policyname FROM pg_policies WHERE tablename = 'admin_users' ORDER BY policyname
    LOOP
        RAISE NOTICE '  ✓ %', policy_count;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;
