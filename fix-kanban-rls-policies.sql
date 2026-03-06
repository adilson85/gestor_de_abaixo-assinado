-- ============================================================================
-- FIX: POLÍTICAS RLS PARA TABELAS KANBAN
-- ============================================================================
-- Este script adiciona políticas RLS para permitir que usuários autenticados
-- acessem as tabelas Kanban (boards, columns, tasks)
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. KANBAN_BOARDS
-- Remover políticas antigas se existirem e criar novas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_boards;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_boards;

-- Criar novas políticas para kanban_boards
CREATE POLICY "Enable read access for authenticated users"
ON public.kanban_boards
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
ON public.kanban_boards
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
ON public.kanban_boards
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
ON public.kanban_boards
FOR DELETE
USING (auth.role() = 'authenticated');

-- 2. KANBAN_COLUMNS
-- Remover políticas antigas se existirem e criar novas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_columns;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_columns;

-- Criar novas políticas para kanban_columns
CREATE POLICY "Enable read access for authenticated users"
ON public.kanban_columns
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
ON public.kanban_columns
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
ON public.kanban_columns
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
ON public.kanban_columns
FOR DELETE
USING (auth.role() = 'authenticated');

-- 3. KANBAN_TASKS
-- Remover políticas antigas se existirem e criar novas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_tasks;

-- Criar novas políticas para kanban_tasks
CREATE POLICY "Enable read access for authenticated users"
ON public.kanban_tasks
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
ON public.kanban_tasks
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
ON public.kanban_tasks
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
ON public.kanban_tasks
FOR DELETE
USING (auth.role() = 'authenticated');

-- 4. OUTRAS TABELAS KANBAN (se não tiverem políticas)
-- kanban_checklists
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_checklists;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_checklists;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_checklists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_checklists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_checklists FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_checklists FOR DELETE USING (auth.role() = 'authenticated');

-- kanban_checklist_items
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_checklist_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_checklist_items;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_checklist_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_checklist_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_checklist_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_checklist_items FOR DELETE USING (auth.role() = 'authenticated');

-- kanban_attachments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_attachments;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_attachments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_attachments FOR DELETE USING (auth.role() = 'authenticated');

-- kanban_comments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_comments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_comments;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_comments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_comments FOR DELETE USING (auth.role() = 'authenticated');

-- kanban_activities
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_activities;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_activities;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_activities FOR DELETE USING (auth.role() = 'authenticated');

-- kanban_task_assignees
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_task_assignees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_task_assignees;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_task_assignees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_task_assignees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_task_assignees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_task_assignees FOR DELETE USING (auth.role() = 'authenticated');

-- kanban_column_deadlines
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kanban_column_deadlines;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kanban_column_deadlines;

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_column_deadlines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_column_deadlines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_column_deadlines FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_column_deadlines FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT
  'Políticas criadas com sucesso!' as status,
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'kanban_%'
ORDER BY tablename, policyname;
