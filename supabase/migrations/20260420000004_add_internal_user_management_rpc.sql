-- =====================================================
-- MIGRATION: RPC seguro para gerenciar usuarios internos
-- Data: 2026-04-20
-- Objetivo:
-- 1. Permitir edicao de usuarios existentes via RPC com SECURITY DEFINER
-- 2. Manter o client sem escrita direta em tabelas sensiveis
-- 3. Dar suporte ao localhost mesmo sem Edge Functions publicadas
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_internal_user_profile(
    target_user_id uuid,
    target_email text,
    target_full_name text DEFAULT NULL,
    target_role text DEFAULT 'operator',
    target_permissions jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actor_id uuid := auth.uid();
    existing_profile public.app_users%ROWTYPE;
    is_existing boolean := false;
    can_create_users boolean := public.has_permission('users.create');
    can_edit_profiles boolean := public.has_permission('users.edit_profile');
    can_edit_permissions boolean := public.has_permission('users.edit_permissions');
    can_toggle_access boolean := public.has_permission('users.deactivate');
    normalized_email text;
    effective_permissions jsonb := '{}'::jsonb;
    permission_record record;
    requested_scope text;
    active_admin_count bigint;
    reactivated boolean := false;
BEGIN
    IF actor_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'userId é obrigatório para editar um usuário existente.';
    END IF;

    normalized_email := lower(trim(COALESCE(target_email, '')));

    IF normalized_email = '' THEN
        RAISE EXCEPTION 'Email é obrigatório.';
    END IF;

    IF target_role NOT IN ('admin', 'operator') THEN
        RAISE EXCEPTION 'Papel inválido. Use admin ou operator.';
    END IF;

    SELECT *
    INTO existing_profile
    FROM public.app_users
    WHERE user_id = target_user_id;

    is_existing := FOUND;

    IF NOT is_existing THEN
        IF NOT can_create_users THEN
            RAISE EXCEPTION 'Acesso negado. Você não possui permissão para criar usuários.';
        END IF;
    ELSIF NOT can_edit_profiles THEN
        RAISE EXCEPTION 'Acesso negado. Você não possui permissão para editar usuários.';
    END IF;

    IF target_permissions IS NOT NULL
       AND jsonb_typeof(target_permissions) = 'object'
       AND target_permissions <> '{}'::jsonb
       AND NOT can_edit_permissions THEN
        RAISE EXCEPTION 'Acesso negado. Você não possui permissão para editar permissões.';
    END IF;

    IF is_existing AND existing_profile.user_id = actor_id AND existing_profile.role = 'admin' AND target_role <> 'admin' THEN
        RAISE EXCEPTION 'Você não pode remover seu próprio acesso de administrador.';
    END IF;

    IF is_existing AND NOT existing_profile.is_active AND NOT can_toggle_access THEN
        RAISE EXCEPTION 'Acesso negado. Você não possui permissão para reativar usuários.';
    END IF;

    IF is_existing AND existing_profile.is_active AND existing_profile.role = 'admin' AND target_role <> 'admin' THEN
        SELECT COUNT(*)
        INTO active_admin_count
        FROM public.app_users
        WHERE role = 'admin'
          AND is_active = true
          AND user_id <> target_user_id;

        IF active_admin_count = 0 THEN
            RAISE EXCEPTION 'É necessário manter pelo menos um administrador ativo no painel.';
        END IF;
    END IF;

    IF is_existing THEN
        reactivated := NOT existing_profile.is_active;

        UPDATE public.app_users
        SET
            email = normalized_email,
            full_name = NULLIF(trim(COALESCE(target_full_name, '')), ''),
            role = target_role,
            is_active = true,
            updated_at = now()
        WHERE user_id = target_user_id;
    ELSE
        INSERT INTO public.app_users (
            user_id,
            email,
            full_name,
            role,
            is_active,
            created_by,
            created_at,
            updated_at
        )
        VALUES (
            target_user_id,
            normalized_email,
            NULLIF(trim(COALESCE(target_full_name, '')), ''),
            target_role,
            true,
            actor_id,
            now(),
            now()
        );
    END IF;

    IF target_role = 'admin' THEN
        DELETE FROM public.app_user_permissions
        WHERE user_id = target_user_id;

        SELECT COALESCE(jsonb_object_agg(code, 'all'), '{}'::jsonb)
        INTO effective_permissions
        FROM public.app_permissions;
    ELSE
        DELETE FROM public.app_user_permissions
        WHERE user_id = target_user_id;

        FOR permission_record IN
            SELECT code, allowed_scopes, default_operator_scope
            FROM public.app_permissions
            ORDER BY code
        LOOP
            IF target_permissions IS NOT NULL
               AND jsonb_typeof(target_permissions) = 'object'
               AND target_permissions ? permission_record.code THEN
                requested_scope := target_permissions ->> permission_record.code;
            ELSE
                requested_scope := public.get_permission_scope(permission_record.code, target_user_id);
            END IF;

            requested_scope := COALESCE(requested_scope, permission_record.default_operator_scope, 'none');

            IF NOT (requested_scope = ANY (permission_record.allowed_scopes)) THEN
                RAISE EXCEPTION 'Escopo % não permitido para a permissão %.', requested_scope, permission_record.code;
            END IF;

            effective_permissions := effective_permissions || jsonb_build_object(permission_record.code, requested_scope);

            IF requested_scope <> 'none' THEN
                INSERT INTO public.app_user_permissions (user_id, permission_code, scope)
                VALUES (target_user_id, permission_record.code, requested_scope)
                ON CONFLICT (user_id, permission_code) DO UPDATE
                SET scope = EXCLUDED.scope,
                    updated_at = now();
            END IF;
        END LOOP;
    END IF;

    INSERT INTO public.admin_audit_log (
        action_type,
        actor_id,
        target_email,
        details,
        created_at
    )
    VALUES (
        'USER_UPSERTED',
        actor_id,
        normalized_email,
        jsonb_build_object(
            'targetUserId', target_user_id,
            'role', target_role,
            'reactivated', reactivated,
            'createdProfile', NOT is_existing,
            'via', 'rpc'
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'userId', target_user_id,
        'email', normalized_email,
        'role', target_role,
        'createdProfile', NOT is_existing,
        'reactivated', reactivated,
        'permissions', effective_permissions,
        'message',
            CASE
                WHEN NOT is_existing THEN 'Usuário interno criado com sucesso.'
                WHEN reactivated THEN 'Usuário reativado com sucesso.'
                ELSE 'Usuário atualizado com sucesso.'
            END
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_internal_user(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actor_id uuid := auth.uid();
    target_profile public.app_users%ROWTYPE;
    active_admin_count bigint;
BEGIN
    IF actor_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF NOT public.has_permission('users.deactivate') THEN
        RAISE EXCEPTION 'Acesso negado. Você não possui permissão para desativar usuários.';
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'userId é obrigatório.';
    END IF;

    IF target_user_id = actor_id THEN
        RAISE EXCEPTION 'Você não pode desativar a si mesmo.';
    END IF;

    SELECT *
    INTO target_profile
    FROM public.app_users
    WHERE user_id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário interno não encontrado.';
    END IF;

    IF target_profile.role = 'admin' AND target_profile.is_active THEN
        SELECT COUNT(*)
        INTO active_admin_count
        FROM public.app_users
        WHERE role = 'admin'
          AND is_active = true
          AND user_id <> target_user_id;

        IF active_admin_count = 0 THEN
            RAISE EXCEPTION 'É necessário manter pelo menos um administrador ativo no painel.';
        END IF;
    END IF;

    UPDATE public.app_users
    SET
        is_active = false,
        updated_at = now()
    WHERE user_id = target_user_id;

    INSERT INTO public.admin_audit_log (
        action_type,
        actor_id,
        target_email,
        details,
        created_at
    )
    VALUES (
        'USER_DEACTIVATED',
        actor_id,
        target_profile.email,
        jsonb_build_object(
            'targetUserId', target_user_id,
            'previousRole', target_profile.role,
            'via', 'rpc'
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuário desativado com sucesso.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_internal_user_profile(uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_internal_user(uuid) TO authenticated;

COMMENT ON FUNCTION public.upsert_internal_user_profile IS 'Edita ou reativa usuarios internos existentes com enforcement de permissoes via SECURITY DEFINER.';
COMMENT ON FUNCTION public.deactivate_internal_user IS 'Desativa usuario interno com enforcement de permissoes via SECURITY DEFINER.';
