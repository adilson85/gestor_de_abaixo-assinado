-- =====================================================
-- MIGRATION: Finalizar app_users como unica fonte de verdade
-- Data: 2026-04-20
-- Objetivo:
-- 1. Fazer backfill final de admins legados que ainda nao tenham perfil interno
-- 2. Remover fallback de autorizacao para admin_users
-- 3. Arquivar admin_users fora da cadeia ativa de acesso
-- =====================================================

-- =====================================================
-- BACKFILL FINAL DE ADMINS LEGADOS AINDA NAO MIGRADOS
-- =====================================================

INSERT INTO public.app_users (
    user_id,
    email,
    role,
    is_active,
    created_by,
    created_at,
    updated_at
)
SELECT
    admin.user_id,
    lower(admin.email),
    'admin',
    COALESCE(admin.is_active, true),
    admin.created_by,
    COALESCE(admin.created_at, now()),
    COALESCE(admin.updated_at, admin.created_at, now())
FROM public.admin_users AS admin
LEFT JOIN public.app_users AS app_user
    ON app_user.user_id = admin.user_id
WHERE app_user.user_id IS NULL
  AND COALESCE(admin.is_active, true) = true
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE public.admin_users IS 'Tabela legada arquivada. Nao participa mais da autorizacao do painel.';

-- =====================================================
-- HELPERS DE ACESSO: REMOVER FALLBACK LEGADO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_internal_role(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_role text;
    profile_is_active boolean;
BEGIN
    IF target_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role, is_active
    INTO profile_role, profile_is_active
    FROM public.app_users
    WHERE user_id = target_user_id;

    IF NOT FOUND OR NOT profile_is_active THEN
        RETURN NULL;
    END IF;

    RETURN profile_role;
END;
$$;

COMMENT ON FUNCTION public.get_internal_role IS 'Retorna o papel interno exclusivamente a partir de app_users.';

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_internal_role(auth.uid());
$$;

COMMENT ON FUNCTION public.get_my_role IS 'Retorna o papel interno do usuario autenticado exclusivamente a partir de app_users.';

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_internal_role(user_id) = 'admin';
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS 'Verifica se o usuario autenticado informado e admin a partir de app_users.';

-- =====================================================
-- ARQUIVAR admin_users FORA DA CADEIA DE ACESSO
-- =====================================================

DROP POLICY IF EXISTS "Admins can read legacy admin users" ON public.admin_users;

REVOKE ALL ON TABLE public.admin_users FROM anon;
REVOKE ALL ON TABLE public.admin_users FROM authenticated;
REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
