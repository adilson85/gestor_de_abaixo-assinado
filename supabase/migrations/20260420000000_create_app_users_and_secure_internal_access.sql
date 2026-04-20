-- =====================================================
-- MIGRATION: Criar app_users e reforcar autorizacao por papel
-- Data: 2026-04-20
-- Objetivo:
-- 1. Criar fonte de verdade de usuarios internos
-- 2. Migrar admins legados
-- 3. Expor helpers de papel reutilizaveis
-- 4. Trocar RLS permissivo por autorizacao real no banco
-- =====================================================

-- =====================================================
-- TABELA PRINCIPAL DE USUARIOS INTERNOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email_unique
    ON public.app_users (lower(email));

CREATE INDEX IF NOT EXISTS idx_app_users_role_active
    ON public.app_users (role, is_active);

CREATE INDEX IF NOT EXISTS idx_app_users_created_by
    ON public.app_users (created_by);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_update_app_users_updated_at ON public.app_users;
CREATE TRIGGER trigger_update_app_users_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.app_users IS 'Fonte de verdade dos usuarios internos do painel';
COMMENT ON COLUMN public.app_users.role IS 'Papel interno do painel: admin ou operator';
COMMENT ON COLUMN public.app_users.is_active IS 'Controla se o usuario pode acessar o painel';

-- =====================================================
-- MIGRACAO LEGADA: admin_users -> app_users
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
WHERE COALESCE(admin.is_active, true) = true
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = 'admin',
    is_active = EXCLUDED.is_active,
    updated_at = now();

COMMENT ON TABLE public.admin_users IS 'Tabela legada de administradores. Mantida temporariamente para compatibilidade.';

-- =====================================================
-- HELPERS DE ACESSO
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

    IF FOUND THEN
        IF profile_is_active THEN
            RETURN profile_role;
        END IF;

        RETURN NULL;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = target_user_id
          AND COALESCE(is_active, true) = true
    ) THEN
        RETURN 'admin';
    END IF;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_internal_role(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_internal_role(user_id) = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role text, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resolved_role text;
BEGIN
    resolved_role := public.get_internal_role(user_id);

    IF resolved_role IS NULL THEN
        RETURN false;
    END IF;

    CASE required_role
        WHEN 'admin' THEN
            RETURN resolved_role = 'admin';
        WHEN 'operator' THEN
            RETURN resolved_role IN ('admin', 'operator');
        ELSE
            RETURN false;
    END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_public_petition(target_petition_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.petitions
        WHERE id = target_petition_id
          AND available_online = true
    );
$$;

COMMENT ON FUNCTION public.get_internal_role IS 'Retorna o papel interno do usuario, usando app_users e fallback legado.';
COMMENT ON FUNCTION public.get_my_role IS 'Retorna o papel do usuario autenticado no painel.';
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Verifica se o usuario autenticado (ou informado) e admin.';
COMMENT ON FUNCTION public.has_role IS 'Aplica hierarquia de papeis: admin >= operator.';
COMMENT ON FUNCTION public.is_public_petition IS 'Verifica se a campanha esta disponivel publicamente.';

-- =====================================================
-- RLS: app_users
-- =====================================================

DROP POLICY IF EXISTS "Admins can read all app users" ON public.app_users;
DROP POLICY IF EXISTS "Panel users can read active app users" ON public.app_users;
DROP POLICY IF EXISTS "Users can read own app user profile" ON public.app_users;

CREATE POLICY "Admins can read all app users"
ON public.app_users
FOR SELECT
USING (public.has_role('admin'));

CREATE POLICY "Panel users can read active app users"
ON public.app_users
FOR SELECT
USING (
    is_active = true
    AND public.has_role('operator')
);

CREATE POLICY "Users can read own app user profile"
ON public.app_users
FOR SELECT
USING (auth.uid() = user_id);

-- Nenhuma policy de escrita para o client.
-- Escrita deve acontecer por service role / Edge Functions.

-- =====================================================
-- RLS: admin_users legado
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can read admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can add new admins" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can update admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can delete admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can read legacy admin users" ON public.admin_users;

CREATE POLICY "Admins can read legacy admin users"
ON public.admin_users
FOR SELECT
USING (public.has_role('admin'));

-- =====================================================
-- RLS: admin_audit_log
-- =====================================================

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can read audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role('admin'));

-- Escrita feita apenas via service role.

-- =====================================================
-- RLS: PETITIONS
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.petitions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.petitions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.petitions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.petitions;
DROP POLICY IF EXISTS "Enable public read for available online petitions" ON public.petitions;
DROP POLICY IF EXISTS "Public can read online petitions" ON public.petitions;
DROP POLICY IF EXISTS "Operators can manage petitions" ON public.petitions;

CREATE POLICY "Public can read online petitions"
ON public.petitions
FOR SELECT
USING (
    available_online = true
    OR public.has_role('operator')
);

CREATE POLICY "Operators can manage petitions"
ON public.petitions
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

-- =====================================================
-- RLS: SIGNATURES
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.signatures;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.signatures;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.signatures;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.signatures;
DROP POLICY IF EXISTS "Enable public read for signature count" ON public.signatures;
DROP POLICY IF EXISTS "Enable public insert for signatures" ON public.signatures;
DROP POLICY IF EXISTS "Public can read signatures from online petitions" ON public.signatures;
DROP POLICY IF EXISTS "Public can sign online petitions" ON public.signatures;
DROP POLICY IF EXISTS "Operators can insert internal signatures" ON public.signatures;
DROP POLICY IF EXISTS "Operators can manage signatures" ON public.signatures;

CREATE POLICY "Public can read signatures from online petitions"
ON public.signatures
FOR SELECT
USING (
    public.is_public_petition(petition_id)
    OR public.has_role('operator')
);

CREATE POLICY "Public can sign online petitions"
ON public.signatures
FOR INSERT
TO public
WITH CHECK (public.is_public_petition(petition_id));

CREATE POLICY "Operators can insert internal signatures"
ON public.signatures
FOR INSERT
WITH CHECK (public.has_role('operator'));

CREATE POLICY "Operators can manage signatures"
ON public.signatures
FOR UPDATE
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

CREATE POLICY "Operators can delete signatures"
ON public.signatures
FOR DELETE
USING (public.has_role('operator'));

-- =====================================================
-- RLS: PETITION RESOURCES
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.petition_resources;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.petition_resources;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.petition_resources;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.petition_resources;
DROP POLICY IF EXISTS "Public can read petition resources for online petitions" ON public.petition_resources;
DROP POLICY IF EXISTS "Operators can manage petition resources" ON public.petition_resources;

CREATE POLICY "Public can read petition resources for online petitions"
ON public.petition_resources
FOR SELECT
USING (
    public.is_public_petition(petition_id)
    OR public.has_role('operator')
);

CREATE POLICY "Operators can manage petition resources"
ON public.petition_resources
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

-- =====================================================
-- RLS: KANBAN E TABELAS INTERNAS
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Panel users can manage kanban boards" ON public.kanban_boards;

CREATE POLICY "Panel users can manage kanban boards"
ON public.kanban_boards
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Panel users can read kanban columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Admins can manage kanban columns" ON public.kanban_columns;

CREATE POLICY "Panel users can read kanban columns"
ON public.kanban_columns
FOR SELECT
USING (public.has_role('operator'));

CREATE POLICY "Admins can manage kanban columns"
ON public.kanban_columns
FOR INSERT
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can update kanban columns"
ON public.kanban_columns
FOR UPDATE
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can delete kanban columns"
ON public.kanban_columns
FOR DELETE
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Panel users can manage kanban tasks" ON public.kanban_tasks;

CREATE POLICY "Panel users can manage kanban tasks"
ON public.kanban_tasks
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Panel users can manage kanban task assignees" ON public.kanban_task_assignees;

CREATE POLICY "Panel users can manage kanban task assignees"
ON public.kanban_task_assignees
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Panel users can manage kanban checklists" ON public.kanban_checklists;

CREATE POLICY "Panel users can manage kanban checklists"
ON public.kanban_checklists
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Panel users can manage kanban checklist items" ON public.kanban_checklist_items;

CREATE POLICY "Panel users can manage kanban checklist items"
ON public.kanban_checklist_items
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Panel users can manage kanban attachments" ON public.kanban_attachments;

CREATE POLICY "Panel users can manage kanban attachments"
ON public.kanban_attachments
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable update for own comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable delete for own comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Panel users can read kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Panel users can insert kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Authors can update own kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Authors or admins can delete kanban comments" ON public.kanban_comments;

CREATE POLICY "Panel users can read kanban comments"
ON public.kanban_comments
FOR SELECT
USING (public.has_role('operator'));

CREATE POLICY "Panel users can insert kanban comments"
ON public.kanban_comments
FOR INSERT
WITH CHECK (
    public.has_role('operator')
    AND auth.uid() = author_id
);

CREATE POLICY "Authors can update own kanban comments"
ON public.kanban_comments
FOR UPDATE
USING (
    public.has_role('operator')
    AND auth.uid() = author_id
)
WITH CHECK (
    public.has_role('operator')
    AND auth.uid() = author_id
);

CREATE POLICY "Authors or admins can delete kanban comments"
ON public.kanban_comments
FOR DELETE
USING (
    (public.has_role('operator') AND auth.uid() = author_id)
    OR public.has_role('admin')
);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Panel users can read kanban activities" ON public.kanban_activities;
DROP POLICY IF EXISTS "Panel users can insert kanban activities" ON public.kanban_activities;
DROP POLICY IF EXISTS "Admins can manage kanban activities" ON public.kanban_activities;

CREATE POLICY "Panel users can read kanban activities"
ON public.kanban_activities
FOR SELECT
USING (public.has_role('operator'));

CREATE POLICY "Panel users can insert kanban activities"
ON public.kanban_activities
FOR INSERT
WITH CHECK (public.has_role('operator'));

CREATE POLICY "Admins can manage kanban activities"
ON public.kanban_activities
FOR UPDATE
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can delete kanban activities"
ON public.kanban_activities
FOR DELETE
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Panel users can read column deadlines" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Admins can manage column deadlines" ON public.kanban_column_deadlines;

CREATE POLICY "Panel users can read column deadlines"
ON public.kanban_column_deadlines
FOR SELECT
USING (public.has_role('operator'));

CREATE POLICY "Admins can insert column deadlines"
ON public.kanban_column_deadlines
FOR INSERT
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can update column deadlines"
ON public.kanban_column_deadlines
FOR UPDATE
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can delete column deadlines"
ON public.kanban_column_deadlines
FOR DELETE
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_labels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_labels;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_labels;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_labels;
DROP POLICY IF EXISTS "Panel users can manage kanban labels" ON public.kanban_labels;

CREATE POLICY "Panel users can manage kanban labels"
ON public.kanban_labels
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_task_labels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_task_labels;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_task_labels;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_task_labels;
DROP POLICY IF EXISTS "Panel users can manage kanban task labels" ON public.kanban_task_labels;

CREATE POLICY "Panel users can manage kanban task labels"
ON public.kanban_task_labels
FOR ALL
USING (public.has_role('operator'))
WITH CHECK (public.has_role('operator'));
