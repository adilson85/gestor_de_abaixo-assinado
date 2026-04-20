-- =====================================================
-- MIGRATION: Permissoes granulares, area de usuarios e
-- reforco de autorizacao por capacidade/escopo
-- Data: 2026-04-20
-- =====================================================

-- =====================================================
-- TABELAS DE PERMISSAO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_permissions (
    code text PRIMARY KEY,
    module text NOT NULL,
    label text NOT NULL,
    description text NOT NULL,
    allowed_scopes text[] NOT NULL DEFAULT ARRAY['none', 'all']::text[],
    default_operator_scope text NOT NULL DEFAULT 'none'
        CHECK (default_operator_scope IN ('none', 'own', 'assigned', 'all')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_user_permissions (
    user_id uuid NOT NULL REFERENCES public.app_users(user_id) ON DELETE CASCADE,
    permission_code text NOT NULL REFERENCES public.app_permissions(code) ON DELETE CASCADE,
    scope text NOT NULL CHECK (scope IN ('none', 'own', 'assigned', 'all')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT app_user_permissions_pkey PRIMARY KEY (user_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_app_permissions_module ON public.app_permissions(module);
CREATE INDEX IF NOT EXISTS idx_app_user_permissions_user_id ON public.app_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_user_permissions_permission_code ON public.app_user_permissions(permission_code);

ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_permissions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_update_app_permissions_updated_at ON public.app_permissions;
CREATE TRIGGER trigger_update_app_permissions_updated_at
    BEFORE UPDATE ON public.app_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_app_user_permissions_updated_at ON public.app_user_permissions;
CREATE TRIGGER trigger_update_app_user_permissions_updated_at
    BEFORE UPDATE ON public.app_user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.app_permissions IS 'Catalogo das permissoes disponiveis no painel interno.';
COMMENT ON TABLE public.app_user_permissions IS 'Escopo efetivo de permissao por usuario interno.';

INSERT INTO public.app_permissions (
    code,
    module,
    label,
    description,
    allowed_scopes,
    default_operator_scope
)
VALUES
    ('dashboard.view', 'dashboard', 'Ver dashboard', 'Acessa os indicadores gerais do painel.', ARRAY['none', 'all']::text[], 'all'),
    ('petitions.view', 'petitions', 'Ver campanhas', 'Lista campanhas e abre detalhes operacionais.', ARRAY['none', 'all']::text[], 'all'),
    ('petitions.create', 'petitions', 'Criar campanhas', 'Cria novos abaixo-assinados no painel.', ARRAY['none', 'all']::text[], 'all'),
    ('petitions.edit', 'petitions', 'Editar campanhas', 'Altera dados operacionais e materiais da campanha.', ARRAY['none', 'all']::text[], 'all'),
    ('petitions.publish', 'petitions', 'Publicar campanhas', 'Liga ou desliga a pagina publica da campanha.', ARRAY['none', 'all']::text[], 'all'),
    ('petitions.delete', 'petitions', 'Excluir campanhas', 'Remove campanhas e os dados vinculados.', ARRAY['none', 'all']::text[], 'none'),
    ('signatures.view', 'signatures', 'Ver assinaturas', 'Consulta a base de apoios captados.', ARRAY['none', 'all']::text[], 'all'),
    ('signatures.create_manual', 'signatures', 'Adicionar assinaturas manualmente', 'Digitaliza e salva apoios coletados fora da pagina publica.', ARRAY['none', 'all']::text[], 'all'),
    ('signatures.edit', 'signatures', 'Editar assinaturas', 'Corrige dados de apoiadores ja cadastrados.', ARRAY['none', 'all']::text[], 'all'),
    ('signatures.delete', 'signatures', 'Excluir assinaturas', 'Apaga registros de apoio.', ARRAY['none', 'all']::text[], 'none'),
    ('signatures.export', 'signatures', 'Exportar assinaturas', 'Baixa CSV e outras saidas de analise.', ARRAY['none', 'all']::text[], 'all'),
    ('signatures.message_status', 'signatures', 'Atualizar status de mensagem', 'Marca follow-up como enviado ou pendente.', ARRAY['none', 'all']::text[], 'all'),
    ('petition_resources.manage', 'petitions', 'Gerenciar links e recursos', 'Adiciona e remove links, videos e materiais da campanha.', ARRAY['none', 'all']::text[], 'all'),
    ('kanban.view', 'kanban', 'Ver Kanban', 'Acompanha o quadro e os cards da operacao.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.create', 'kanban', 'Criar cards', 'Abre novas tarefas no quadro.', ARRAY['none', 'all']::text[], 'all'),
    ('kanban.edit', 'kanban', 'Editar cards', 'Altera titulo, descricao, prioridade e prazo das tarefas.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.move', 'kanban', 'Mover cards', 'Move tarefas entre colunas e atualiza etapa.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.archive', 'kanban', 'Arquivar cards', 'Arquiva ou restaura tarefas do quadro.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.delete', 'kanban', 'Excluir cards', 'Remove tarefas definitivamente.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'none'),
    ('kanban.assign_users', 'kanban', 'Atribuir responsaveis', 'Define quem fica responsavel por cada tarefa.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.manage_labels', 'kanban', 'Gerenciar etiquetas', 'Aplica e cria etiquetas no Kanban.', ARRAY['none', 'all']::text[], 'all'),
    ('kanban.comment', 'kanban', 'Comentar', 'Comenta e acompanha a conversa nos cards.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.attachment', 'kanban', 'Gerenciar anexos', 'Adiciona e remove links ou arquivos nas tarefas.', ARRAY['none', 'own', 'assigned', 'all']::text[], 'all'),
    ('kanban.manage_columns', 'kanban', 'Gerenciar colunas', 'Altera a estrutura do quadro.', ARRAY['none', 'all']::text[], 'none'),
    ('kanban.manage_deadlines', 'kanban', 'Gerenciar prazos de etapa', 'Configura vencimentos automaticos por coluna.', ARRAY['none', 'all']::text[], 'none'),
    ('users.view', 'users', 'Ver usuarios', 'Acompanha equipe ativa, status e resumo de acessos.', ARRAY['none', 'all']::text[], 'none'),
    ('users.create', 'users', 'Criar usuarios', 'Convida ou cria novos acessos internos.', ARRAY['none', 'all']::text[], 'none'),
    ('users.edit_profile', 'users', 'Editar perfil de usuarios', 'Altera nome e papel-base dos acessos internos.', ARRAY['none', 'all']::text[], 'none'),
    ('users.edit_permissions', 'users', 'Editar permissoes', 'Define o que cada usuario pode fazer no painel.', ARRAY['none', 'all']::text[], 'none'),
    ('users.reset_password', 'users', 'Gerar senha temporaria', 'Reseta a senha e entrega uma credencial provisoria.', ARRAY['none', 'all']::text[], 'none'),
    ('users.deactivate', 'users', 'Desativar usuarios', 'Suspende ou reativa acessos internos.', ARRAY['none', 'all']::text[], 'none'),
    ('settings.backup_export', 'settings', 'Exportar backup', 'Gera backup operacional da base.', ARRAY['none', 'all']::text[], 'none'),
    ('settings.backup_import', 'settings', 'Importar backup', 'Substitui a base operacional por um pacote importado.', ARRAY['none', 'all']::text[], 'none'),
    ('settings.audit_view', 'settings', 'Ver auditoria', 'Consulta historico de acoes administrativas.', ARRAY['none', 'all']::text[], 'none'),
    ('settings.wipe_data', 'settings', 'Limpar dados', 'Executa a limpeza global da operacao.', ARRAY['none', 'all']::text[], 'none')
ON CONFLICT (code) DO UPDATE SET
    module = EXCLUDED.module,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    allowed_scopes = EXCLUDED.allowed_scopes,
    default_operator_scope = EXCLUDED.default_operator_scope,
    updated_at = now();

-- =====================================================
-- HELPERS DE PERMISSAO
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_app_user_permission_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    allowed_scopes text[];
BEGIN
    SELECT app_permissions.allowed_scopes
    INTO allowed_scopes
    FROM public.app_permissions
    WHERE code = NEW.permission_code;

    IF allowed_scopes IS NULL THEN
        RAISE EXCEPTION 'Permissao % nao encontrada.', NEW.permission_code;
    END IF;

    IF NOT (NEW.scope = ANY (allowed_scopes)) THEN
        RAISE EXCEPTION 'Escopo % nao permitido para a permissao %.', NEW.scope, NEW.permission_code;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_app_user_permission_scope ON public.app_user_permissions;
CREATE TRIGGER trigger_validate_app_user_permission_scope
    BEFORE INSERT OR UPDATE ON public.app_user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_app_user_permission_scope();

CREATE OR REPLACE FUNCTION public.get_permission_scope(permission_code text, target_user_id uuid DEFAULT auth.uid())
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
      AND permission_code = get_permission_scope.permission_code;

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

CREATE OR REPLACE FUNCTION public.permission_scope_satisfies(actual_scope text, required_scope text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF actual_scope IS NULL OR actual_scope = 'none' THEN
        RETURN false;
    END IF;

    IF required_scope IS NULL OR required_scope = 'any' THEN
        RETURN actual_scope <> 'none';
    END IF;

    CASE required_scope
        WHEN 'all' THEN
            RETURN actual_scope = 'all';
        WHEN 'assigned' THEN
            RETURN actual_scope IN ('assigned', 'all');
        WHEN 'own' THEN
            RETURN actual_scope IN ('own', 'all');
        WHEN 'none' THEN
            RETURN actual_scope <> 'none';
        ELSE
            RETURN false;
    END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_code text, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_permission_scope(permission_code, target_user_id) <> 'none';
$$;

CREATE OR REPLACE FUNCTION public.has_permission_scope(
    permission_code text,
    required_scope text,
    target_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.permission_scope_satisfies(
        public.get_permission_scope(permission_code, target_user_id),
        required_scope
    );
$$;

CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        jsonb_object_agg(
            app_permissions.code,
            public.get_permission_scope(app_permissions.code, auth.uid())
        ),
        '{}'::jsonb
    )
    FROM public.app_permissions;
$$;

CREATE OR REPLACE FUNCTION public.can_access_kanban_task(
    permission_code text,
    target_task_id uuid,
    target_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resolved_scope text;
BEGIN
    resolved_scope := public.get_permission_scope(permission_code, target_user_id);

    IF resolved_scope = 'all' THEN
        RETURN true;
    END IF;

    IF resolved_scope = 'own' THEN
        RETURN EXISTS (
            SELECT 1
            FROM public.kanban_tasks
            WHERE id = target_task_id
              AND created_by = target_user_id
        );
    END IF;

    IF resolved_scope = 'assigned' THEN
        RETURN EXISTS (
            SELECT 1
            FROM public.kanban_task_assignees
            WHERE task_id = target_task_id
              AND user_id = target_user_id
        );
    END IF;

    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_kanban_checklist(
    permission_code text,
    target_checklist_id uuid,
    target_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.can_access_kanban_task(
        permission_code,
        kanban_checklists.task_id,
        target_user_id
    )
    FROM public.kanban_checklists
    WHERE kanban_checklists.id = target_checklist_id;
$$;

COMMENT ON FUNCTION public.get_permission_scope IS 'Retorna o escopo efetivo de uma permissao para o usuario autenticado.';
COMMENT ON FUNCTION public.has_permission IS 'Verifica se a permissao efetiva nao e none.';
COMMENT ON FUNCTION public.has_permission_scope IS 'Compara escopo efetivo com o escopo minimo exigido.';
COMMENT ON FUNCTION public.get_my_permissions IS 'Retorna o mapa efetivo de permissoes do usuario autenticado.';
COMMENT ON FUNCTION public.can_access_kanban_task IS 'Aplica escopo de acesso a cards do Kanban.';

-- =====================================================
-- TRIGGERS DE ENFORCEMENT POR ACAO
-- =====================================================

CREATE OR REPLACE FUNCTION public.enforce_petition_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requires_edit boolean := false;
    requires_publish boolean := false;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NOT public.has_permission('petitions.create') THEN
            RAISE EXCEPTION 'Voce nao possui permissao para criar campanhas.';
        END IF;

        IF COALESCE(NEW.available_online, false) AND NOT public.has_permission('petitions.publish') THEN
            RAISE EXCEPTION 'Voce nao possui permissao para publicar campanhas.';
        END IF;

        RETURN NEW;
    END IF;

    requires_edit :=
        NEW.name IS DISTINCT FROM OLD.name OR
        NEW.description IS DISTINCT FROM OLD.description OR
        NEW.location IS DISTINCT FROM OLD.location OR
        NEW.collection_date IS DISTINCT FROM OLD.collection_date OR
        NEW.responsible IS DISTINCT FROM OLD.responsible OR
        NEW.image_url IS DISTINCT FROM OLD.image_url OR
        NEW.signature_goal IS DISTINCT FROM OLD.signature_goal;

    requires_publish := NEW.available_online IS DISTINCT FROM OLD.available_online;

    IF requires_edit AND NOT public.has_permission('petitions.edit') THEN
        RAISE EXCEPTION 'Voce nao possui permissao para editar campanhas.';
    END IF;

    IF requires_publish AND NOT public.has_permission('petitions.publish') THEN
        RAISE EXCEPTION 'Voce nao possui permissao para publicar campanhas.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_petition_permissions ON public.petitions;
CREATE TRIGGER trigger_enforce_petition_permissions
    BEFORE INSERT OR UPDATE ON public.petitions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_petition_permissions();

CREATE OR REPLACE FUNCTION public.enforce_signature_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_changed boolean := false;
    status_changed boolean := false;
BEGIN
    profile_changed :=
        NEW.name IS DISTINCT FROM OLD.name OR
        NEW.phone IS DISTINCT FROM OLD.phone OR
        NEW.street IS DISTINCT FROM OLD.street OR
        NEW.neighborhood IS DISTINCT FROM OLD.neighborhood OR
        NEW.city IS DISTINCT FROM OLD.city OR
        NEW.state IS DISTINCT FROM OLD.state OR
        NEW.zip_code IS DISTINCT FROM OLD.zip_code OR
        NEW.birth_date IS DISTINCT FROM OLD.birth_date;

    status_changed := NEW.mensagem_enviada IS DISTINCT FROM OLD.mensagem_enviada;

    IF profile_changed AND NOT public.has_permission('signatures.edit') THEN
        RAISE EXCEPTION 'Voce nao possui permissao para editar assinaturas.';
    END IF;

    IF status_changed AND NOT public.has_permission('signatures.message_status') THEN
        RAISE EXCEPTION 'Voce nao possui permissao para atualizar o status de mensagem.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_signature_permissions ON public.signatures;
CREATE TRIGGER trigger_enforce_signature_permissions
    BEFORE UPDATE ON public.signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_signature_permissions();

CREATE OR REPLACE FUNCTION public.enforce_kanban_task_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    content_changed boolean := false;
    movement_changed boolean := false;
    archive_changed boolean := false;
BEGIN
    content_changed :=
        NEW.title IS DISTINCT FROM OLD.title OR
        NEW.description IS DISTINCT FROM OLD.description OR
        NEW.priority IS DISTINCT FROM OLD.priority OR
        NEW.due_date IS DISTINCT FROM OLD.due_date OR
        NEW.petition_id IS DISTINCT FROM OLD.petition_id;

    movement_changed :=
        NEW.column_id IS DISTINCT FROM OLD.column_id OR
        NEW.position IS DISTINCT FROM OLD.position;

    archive_changed := NEW.is_archived IS DISTINCT FROM OLD.is_archived;

    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION 'created_by nao pode ser alterado.';
    END IF;

    IF content_changed AND NOT public.can_access_kanban_task('kanban.edit', OLD.id) THEN
        RAISE EXCEPTION 'Voce nao possui permissao para editar esta tarefa.';
    END IF;

    IF movement_changed AND NOT public.can_access_kanban_task('kanban.move', OLD.id) THEN
        RAISE EXCEPTION 'Voce nao possui permissao para mover esta tarefa.';
    END IF;

    IF archive_changed AND NOT public.can_access_kanban_task('kanban.archive', OLD.id) THEN
        RAISE EXCEPTION 'Voce nao possui permissao para arquivar esta tarefa.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_kanban_task_permissions ON public.kanban_tasks;
CREATE TRIGGER trigger_enforce_kanban_task_permissions
    BEFORE UPDATE ON public.kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_kanban_task_permissions();

-- =====================================================
-- RLS: APP PERMISSIONS
-- =====================================================

DROP POLICY IF EXISTS "Panel users can read app permissions" ON public.app_permissions;
DROP POLICY IF EXISTS "Admins can read all app user permissions" ON public.app_user_permissions;
DROP POLICY IF EXISTS "Authorized users can read all app user permissions" ON public.app_user_permissions;
DROP POLICY IF EXISTS "Users can read own app user permissions" ON public.app_user_permissions;

CREATE POLICY "Panel users can read app permissions"
ON public.app_permissions
FOR SELECT
USING (public.has_role('operator'));

CREATE POLICY "Authorized users can read all app user permissions"
ON public.app_user_permissions
FOR SELECT
USING (
    public.has_permission('users.view')
    OR public.has_permission('users.edit_permissions')
);

CREATE POLICY "Users can read own app user permissions"
ON public.app_user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Escrita em app_user_permissions ocorre apenas via Edge Functions / service role.

-- =====================================================
-- BACKFILL DE PERMISSOES PARA OPERADORES ATUAIS
-- =====================================================

INSERT INTO public.app_user_permissions (
    user_id,
    permission_code,
    scope
)
SELECT
    app_users.user_id,
    app_permissions.code,
    app_permissions.default_operator_scope
FROM public.app_users
CROSS JOIN public.app_permissions
WHERE app_users.role = 'operator'
  AND app_users.is_active = true
  AND app_permissions.default_operator_scope <> 'none'
ON CONFLICT (user_id, permission_code) DO NOTHING;

-- =====================================================
-- RLS: PETITIONS
-- =====================================================

DROP POLICY IF EXISTS "Public can read online petitions" ON public.petitions;
DROP POLICY IF EXISTS "Operators can manage petitions" ON public.petitions;
DROP POLICY IF EXISTS "Public can read online petitions with granular permissions" ON public.petitions;
DROP POLICY IF EXISTS "Panel users can create petitions with granular permissions" ON public.petitions;
DROP POLICY IF EXISTS "Panel users can update petitions with granular permissions" ON public.petitions;
DROP POLICY IF EXISTS "Panel users can delete petitions with granular permissions" ON public.petitions;

CREATE POLICY "Public can read online petitions with granular permissions"
ON public.petitions
FOR SELECT
USING (
    available_online = true
    OR public.has_permission('petitions.view')
);

CREATE POLICY "Panel users can create petitions with granular permissions"
ON public.petitions
FOR INSERT
WITH CHECK (
    public.has_permission('petitions.create')
    AND (
        COALESCE(available_online, false) = false
        OR public.has_permission('petitions.publish')
    )
);

CREATE POLICY "Panel users can update petitions with granular permissions"
ON public.petitions
FOR UPDATE
USING (
    public.has_permission('petitions.edit')
    OR public.has_permission('petitions.publish')
)
WITH CHECK (
    public.has_permission('petitions.edit')
    OR public.has_permission('petitions.publish')
);

CREATE POLICY "Panel users can delete petitions with granular permissions"
ON public.petitions
FOR DELETE
USING (public.has_permission('petitions.delete'));

-- =====================================================
-- RLS: SIGNATURES
-- =====================================================

DROP POLICY IF EXISTS "Public can read signatures from online petitions" ON public.signatures;
DROP POLICY IF EXISTS "Public can sign online petitions" ON public.signatures;
DROP POLICY IF EXISTS "Operators can insert internal signatures" ON public.signatures;
DROP POLICY IF EXISTS "Operators can manage signatures" ON public.signatures;
DROP POLICY IF EXISTS "Operators can delete signatures" ON public.signatures;
DROP POLICY IF EXISTS "Public can read signatures with granular permissions" ON public.signatures;
DROP POLICY IF EXISTS "Public can sign online petitions with granular permissions" ON public.signatures;
DROP POLICY IF EXISTS "Panel users can insert internal signatures with granular permissions" ON public.signatures;
DROP POLICY IF EXISTS "Panel users can update signatures with granular permissions" ON public.signatures;
DROP POLICY IF EXISTS "Panel users can delete signatures with granular permissions" ON public.signatures;

CREATE POLICY "Public can read signatures with granular permissions"
ON public.signatures
FOR SELECT
USING (
    public.is_public_petition(petition_id)
    OR public.has_permission('signatures.view')
);

CREATE POLICY "Public can sign online petitions with granular permissions"
ON public.signatures
FOR INSERT
TO public
WITH CHECK (public.is_public_petition(petition_id));

CREATE POLICY "Panel users can insert internal signatures with granular permissions"
ON public.signatures
FOR INSERT
WITH CHECK (public.has_permission('signatures.create_manual'));

CREATE POLICY "Panel users can update signatures with granular permissions"
ON public.signatures
FOR UPDATE
USING (
    public.has_permission('signatures.edit')
    OR public.has_permission('signatures.message_status')
)
WITH CHECK (
    public.has_permission('signatures.edit')
    OR public.has_permission('signatures.message_status')
);

CREATE POLICY "Panel users can delete signatures with granular permissions"
ON public.signatures
FOR DELETE
USING (public.has_permission('signatures.delete'));

-- =====================================================
-- RLS: PETITION RESOURCES
-- =====================================================

DROP POLICY IF EXISTS "Public can read petition resources for online petitions" ON public.petition_resources;
DROP POLICY IF EXISTS "Operators can manage petition resources" ON public.petition_resources;
DROP POLICY IF EXISTS "Public can read petition resources with granular permissions" ON public.petition_resources;
DROP POLICY IF EXISTS "Panel users can manage petition resources with granular permissions" ON public.petition_resources;

CREATE POLICY "Public can read petition resources with granular permissions"
ON public.petition_resources
FOR SELECT
USING (
    public.is_public_petition(petition_id)
    OR public.has_permission('petitions.view')
);

CREATE POLICY "Panel users can manage petition resources with granular permissions"
ON public.petition_resources
FOR ALL
USING (public.has_permission('petition_resources.manage'))
WITH CHECK (public.has_permission('petition_resources.manage'));

-- =====================================================
-- RLS: KANBAN
-- =====================================================

DROP POLICY IF EXISTS "Panel users can manage kanban boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "Panel users can read kanban columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Admins can manage kanban columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Panel users can manage kanban tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Panel users can manage kanban task assignees" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Panel users can manage kanban checklists" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Panel users can manage kanban checklist items" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Panel users can manage kanban attachments" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Panel users can read kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Panel users can insert kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Authors can update own kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Authors or admins can delete kanban comments" ON public.kanban_comments;
DROP POLICY IF EXISTS "Panel users can read kanban activities" ON public.kanban_activities;
DROP POLICY IF EXISTS "Panel users can insert kanban activities" ON public.kanban_activities;
DROP POLICY IF EXISTS "Admins can manage kanban activities" ON public.kanban_activities;
DROP POLICY IF EXISTS "Panel users can read column deadlines" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Admins can insert column deadlines" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Admins can update column deadlines" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Admins can delete column deadlines" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Panel users can manage kanban labels" ON public.kanban_labels;
DROP POLICY IF EXISTS "Panel users can manage kanban task labels" ON public.kanban_task_labels;

CREATE POLICY "Panel users can read kanban boards with granular permissions"
ON public.kanban_boards
FOR SELECT
USING (public.has_permission('kanban.view'));

CREATE POLICY "Panel users can manage kanban boards with granular permissions"
ON public.kanban_boards
FOR INSERT
WITH CHECK (public.has_permission('kanban.manage_columns'));

CREATE POLICY "Panel users can update kanban boards with granular permissions"
ON public.kanban_boards
FOR UPDATE
USING (public.has_permission('kanban.manage_columns'))
WITH CHECK (public.has_permission('kanban.manage_columns'));

CREATE POLICY "Panel users can delete kanban boards with granular permissions"
ON public.kanban_boards
FOR DELETE
USING (public.has_permission('kanban.manage_columns'));

CREATE POLICY "Panel users can read kanban columns with granular permissions"
ON public.kanban_columns
FOR SELECT
USING (public.has_permission('kanban.view'));

CREATE POLICY "Panel users can manage kanban columns with granular permissions"
ON public.kanban_columns
FOR INSERT
WITH CHECK (public.has_permission('kanban.manage_columns'));

CREATE POLICY "Panel users can update kanban columns with granular permissions"
ON public.kanban_columns
FOR UPDATE
USING (public.has_permission('kanban.manage_columns'))
WITH CHECK (public.has_permission('kanban.manage_columns'));

CREATE POLICY "Panel users can delete kanban columns with granular permissions"
ON public.kanban_columns
FOR DELETE
USING (public.has_permission('kanban.manage_columns'));

CREATE POLICY "Panel users can read kanban tasks with granular permissions"
ON public.kanban_tasks
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', id));

CREATE POLICY "Panel users can create kanban tasks with granular permissions"
ON public.kanban_tasks
FOR INSERT
WITH CHECK (
    public.has_permission('kanban.create')
    AND created_by = auth.uid()
);

CREATE POLICY "Panel users can update kanban tasks with granular permissions"
ON public.kanban_tasks
FOR UPDATE
USING (
    public.can_access_kanban_task('kanban.edit', id)
    OR public.can_access_kanban_task('kanban.move', id)
    OR public.can_access_kanban_task('kanban.archive', id)
)
WITH CHECK (
    public.can_access_kanban_task('kanban.edit', id)
    OR public.can_access_kanban_task('kanban.move', id)
    OR public.can_access_kanban_task('kanban.archive', id)
);

CREATE POLICY "Panel users can delete kanban tasks with granular permissions"
ON public.kanban_tasks
FOR DELETE
USING (public.can_access_kanban_task('kanban.delete', id));

CREATE POLICY "Panel users can read kanban assignees with granular permissions"
ON public.kanban_task_assignees
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', task_id));

CREATE POLICY "Panel users can manage kanban assignees with granular permissions"
ON public.kanban_task_assignees
FOR INSERT
WITH CHECK (public.can_access_kanban_task('kanban.assign_users', task_id));

CREATE POLICY "Panel users can delete kanban assignees with granular permissions"
ON public.kanban_task_assignees
FOR DELETE
USING (public.can_access_kanban_task('kanban.assign_users', task_id));

CREATE POLICY "Panel users can read kanban checklists with granular permissions"
ON public.kanban_checklists
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', task_id));

CREATE POLICY "Panel users can manage kanban checklists with granular permissions"
ON public.kanban_checklists
FOR INSERT
WITH CHECK (public.can_access_kanban_task('kanban.edit', task_id));

CREATE POLICY "Panel users can update kanban checklists with granular permissions"
ON public.kanban_checklists
FOR UPDATE
USING (public.can_access_kanban_task('kanban.edit', task_id))
WITH CHECK (public.can_access_kanban_task('kanban.edit', task_id));

CREATE POLICY "Panel users can delete kanban checklists with granular permissions"
ON public.kanban_checklists
FOR DELETE
USING (public.can_access_kanban_task('kanban.edit', task_id));

CREATE POLICY "Panel users can read kanban checklist items with granular permissions"
ON public.kanban_checklist_items
FOR SELECT
USING (public.can_access_kanban_checklist('kanban.view', checklist_id));

CREATE POLICY "Panel users can manage kanban checklist items with granular permissions"
ON public.kanban_checklist_items
FOR INSERT
WITH CHECK (public.can_access_kanban_checklist('kanban.edit', checklist_id));

CREATE POLICY "Panel users can update kanban checklist items with granular permissions"
ON public.kanban_checklist_items
FOR UPDATE
USING (public.can_access_kanban_checklist('kanban.edit', checklist_id))
WITH CHECK (public.can_access_kanban_checklist('kanban.edit', checklist_id));

CREATE POLICY "Panel users can delete kanban checklist items with granular permissions"
ON public.kanban_checklist_items
FOR DELETE
USING (public.can_access_kanban_checklist('kanban.edit', checklist_id));

CREATE POLICY "Panel users can read kanban attachments with granular permissions"
ON public.kanban_attachments
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', task_id));

CREATE POLICY "Panel users can insert kanban attachments with granular permissions"
ON public.kanban_attachments
FOR INSERT
WITH CHECK (
    public.can_access_kanban_task('kanban.attachment', task_id)
    AND created_by = auth.uid()
);

CREATE POLICY "Panel users can delete kanban attachments with granular permissions"
ON public.kanban_attachments
FOR DELETE
USING (public.can_access_kanban_task('kanban.attachment', task_id));

CREATE POLICY "Panel users can read kanban comments with granular permissions"
ON public.kanban_comments
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', task_id));

CREATE POLICY "Panel users can insert kanban comments with granular permissions"
ON public.kanban_comments
FOR INSERT
WITH CHECK (
    public.can_access_kanban_task('kanban.comment', task_id)
    AND auth.uid() = author_id
);

CREATE POLICY "Authors can update own kanban comments with granular permissions"
ON public.kanban_comments
FOR UPDATE
USING (
    public.can_access_kanban_task('kanban.comment', task_id)
    AND auth.uid() = author_id
)
WITH CHECK (
    public.can_access_kanban_task('kanban.comment', task_id)
    AND auth.uid() = author_id
);

CREATE POLICY "Authors can delete own kanban comments with granular permissions"
ON public.kanban_comments
FOR DELETE
USING (
    auth.uid() = author_id
    AND public.can_access_kanban_task('kanban.comment', task_id)
);

CREATE POLICY "Panel users can read kanban activities with granular permissions"
ON public.kanban_activities
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', task_id));

CREATE POLICY "Panel users can insert kanban activities with granular permissions"
ON public.kanban_activities
FOR INSERT
WITH CHECK (public.can_access_kanban_task('kanban.edit', task_id));

CREATE POLICY "Panel users can read kanban deadlines with granular permissions"
ON public.kanban_column_deadlines
FOR SELECT
USING (public.has_permission('kanban.view'));

CREATE POLICY "Panel users can manage kanban deadlines with granular permissions"
ON public.kanban_column_deadlines
FOR INSERT
WITH CHECK (public.has_permission('kanban.manage_deadlines'));

CREATE POLICY "Panel users can update kanban deadlines with granular permissions"
ON public.kanban_column_deadlines
FOR UPDATE
USING (public.has_permission('kanban.manage_deadlines'))
WITH CHECK (public.has_permission('kanban.manage_deadlines'));

CREATE POLICY "Panel users can delete kanban deadlines with granular permissions"
ON public.kanban_column_deadlines
FOR DELETE
USING (public.has_permission('kanban.manage_deadlines'));

CREATE POLICY "Panel users can read kanban labels with granular permissions"
ON public.kanban_labels
FOR SELECT
USING (public.has_permission('kanban.view'));

CREATE POLICY "Panel users can manage kanban labels with granular permissions"
ON public.kanban_labels
FOR ALL
USING (public.has_permission('kanban.manage_labels'))
WITH CHECK (public.has_permission('kanban.manage_labels'));

CREATE POLICY "Panel users can read kanban task labels with granular permissions"
ON public.kanban_task_labels
FOR SELECT
USING (public.can_access_kanban_task('kanban.view', task_id));

CREATE POLICY "Panel users can manage kanban task labels with granular permissions"
ON public.kanban_task_labels
FOR INSERT
WITH CHECK (
    public.has_permission('kanban.manage_labels')
    AND public.can_access_kanban_task('kanban.edit', task_id)
);

CREATE POLICY "Panel users can delete kanban task labels with granular permissions"
ON public.kanban_task_labels
FOR DELETE
USING (
    public.has_permission('kanban.manage_labels')
    AND public.can_access_kanban_task('kanban.edit', task_id)
);

-- =====================================================
-- RLS: AUDITORIA
-- =====================================================

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can read audit logs with granular permissions" ON public.admin_audit_log;

CREATE POLICY "Admins can read audit logs with granular permissions"
ON public.admin_audit_log
FOR SELECT
USING (public.has_permission('settings.audit_view'));
