CREATE OR REPLACE FUNCTION public.get_permission_scope(
    permission_code text,
    target_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resolved_role text;
    explicit_scope text;
    default_scope text;
BEGIN
    IF permission_code IS NULL OR target_user_id IS NULL THEN
        RETURN 'none';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.app_permissions
        WHERE code = permission_code
    ) THEN
        RETURN 'none';
    END IF;

    resolved_role := public.get_internal_role(target_user_id);

    IF resolved_role IS NULL THEN
        RETURN 'none';
    END IF;

    IF resolved_role = 'admin' THEN
        RETURN 'all';
    END IF;

    SELECT app_user_permissions.scope
    INTO explicit_scope
    FROM public.app_user_permissions
    WHERE user_id = target_user_id
      AND app_user_permissions.permission_code = get_permission_scope.permission_code;

    IF explicit_scope IS NOT NULL THEN
        RETURN explicit_scope;
    END IF;

    SELECT app_permissions.default_operator_scope
    INTO default_scope
    FROM public.app_permissions
    WHERE code = permission_code;

    RETURN COALESCE(default_scope, 'none');
END;
$$;

COMMENT ON FUNCTION public.get_permission_scope IS 'Retorna o escopo efetivo de uma permissao para o usuario autenticado.';
