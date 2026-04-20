-- =====================================================
-- MIGRATION: Remover policies legadas que ainda ampliavam acesso
-- Data: 2026-04-20
-- Objetivo:
-- 1. Eliminar policies herdadas do historico antigo que ainda coexistiam
-- 2. Garantir que a autorizacao dependa apenas das rules atuais por papel
-- 3. Limpar a funcao is_admin() sem argumentos, hoje obsoleta
-- =====================================================

-- =====================================================
-- HELPERS LEGADOS
-- =====================================================

DROP FUNCTION IF EXISTS public.is_admin();

-- =====================================================
-- ADMIN USERS
-- =====================================================

DROP POLICY IF EXISTS "Admins can read own data" ON public.admin_users;
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON public.admin_users;

-- =====================================================
-- PETITIONS / SIGNATURES / RESOURCES
-- =====================================================

DROP POLICY IF EXISTS "Admins can read petitions" ON public.petitions;
DROP POLICY IF EXISTS "Admins can insert petitions" ON public.petitions;
DROP POLICY IF EXISTS "Admins can update petitions" ON public.petitions;
DROP POLICY IF EXISTS "Admins can delete petitions" ON public.petitions;
DROP POLICY IF EXISTS "Authenticated users can read all petitions" ON public.petitions;
DROP POLICY IF EXISTS "Authenticated users can insert petitions" ON public.petitions;
DROP POLICY IF EXISTS "Authenticated users can update petitions" ON public.petitions;
DROP POLICY IF EXISTS "Authenticated users can delete petitions" ON public.petitions;

DROP POLICY IF EXISTS "Authenticated users can read all signatures" ON public.signatures;
DROP POLICY IF EXISTS "Authenticated users can insert signatures" ON public.signatures;
DROP POLICY IF EXISTS "Authenticated users can update signatures" ON public.signatures;
DROP POLICY IF EXISTS "Authenticated users can delete signatures" ON public.signatures;

DROP POLICY IF EXISTS "Authenticated users can read resources" ON public.petition_resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.petition_resources;
DROP POLICY IF EXISTS "Authenticated users can update resources" ON public.petition_resources;
DROP POLICY IF EXISTS "Authenticated users can delete resources" ON public.petition_resources;

-- =====================================================
-- KANBAN: POLICIES PERMISSIVAS OU DUPLICADAS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can read boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "Authenticated users can insert boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "Authenticated users can update boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "Authenticated users can delete boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "kanban_boards_access" ON public.kanban_boards;

DROP POLICY IF EXISTS "Authenticated users can read columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Authenticated users can insert columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Authenticated users can update columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Authenticated users can delete columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_access" ON public.kanban_columns;

DROP POLICY IF EXISTS "Authenticated users can read tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "kanban_tasks_access" ON public.kanban_tasks;

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "kanban_comments_access" ON public.kanban_comments;

DROP POLICY IF EXISTS "kanban_activities_access" ON public.kanban_activities;
DROP POLICY IF EXISTS "kanban_attachments_access" ON public.kanban_attachments;
DROP POLICY IF EXISTS "kanban_checklists_access" ON public.kanban_checklists;
DROP POLICY IF EXISTS "kanban_checklist_items_access" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "kanban_task_assignees_access" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "kanban_labels_access" ON public.kanban_labels;
DROP POLICY IF EXISTS "kanban_task_labels_access" ON public.kanban_task_labels;
