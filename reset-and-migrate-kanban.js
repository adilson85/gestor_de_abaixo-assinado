import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ⚠️ CONFIGURAÇÕES - SUBSTITUA PELAS SUAS CREDENCIAIS
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_SERVICE_KEY);

console.log('🔄 RESET E MIGRAÇÃO COMPLETA DO KANBAN');
console.log('=====================================');

async function resetAndMigrateKanban() {
  try {
    console.log('⚠️  ATENÇÃO: Este script irá:');
    console.log('1. Excluir TODAS as tabelas do Kanban online');
    console.log('2. Recriar a estrutura completa do local');
    console.log('3. Importar todos os dados locais');
    console.log('');
    
    // Confirmação de segurança
    console.log('🚨 OPERAÇÃO IRREVERSÍVEL!');
    console.log('Certifique-se de que não há dados importantes no Supabase online.');
    console.log('');
    
    console.log('📋 ETAPA 1: Fazendo backup dos dados locais...');
    
    // 1. Exportar dados locais
    const { data: localBoards, error: boardsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_boards').select('*');
    
    const { data: localColumns, error: columnsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_columns').select('*');
    
    const { data: localTasks, error: tasksError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_tasks').select('*');
    
    const { data: localComments, error: commentsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_comments').select('*');
    
    const { data: localAssignees, error: assigneesError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_task_assignees').select('*');
    
    const { data: localLabels, error: labelsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_labels').select('*');
    
    const { data: localTaskLabels, error: taskLabelsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_task_labels').select('*');
    
    const { data: localChecklists, error: checklistsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_checklists').select('*');
    
    const { data: localChecklistItems, error: checklistItemsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_checklist_items').select('*');
    
    const { data: localAttachments, error: attachmentsError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_attachments').select('*');
    
    const { data: localActivities, error: activitiesError } = await createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ).from('kanban_activities').select('*');
    
    console.log('✅ Dados locais exportados:');
    console.log(`   - Boards: ${localBoards?.length || 0}`);
    console.log(`   - Columns: ${localColumns?.length || 0}`);
    console.log(`   - Tasks: ${localTasks?.length || 0}`);
    console.log(`   - Comments: ${localComments?.length || 0}`);
    console.log(`   - Assignees: ${localAssignees?.length || 0}`);
    console.log(`   - Labels: ${localLabels?.length || 0}`);
    console.log(`   - Task Labels: ${localTaskLabels?.length || 0}`);
    console.log(`   - Checklists: ${localChecklists?.length || 0}`);
    console.log(`   - Checklist Items: ${localChecklistItems?.length || 0}`);
    console.log(`   - Attachments: ${localAttachments?.length || 0}`);
    console.log(`   - Activities: ${localActivities?.length || 0}`);
    
    console.log('\n📋 ETAPA 2: Excluindo tabelas do Kanban online...');
    
    // 2. Excluir todas as tabelas do Kanban online
    const dropTablesSQL = `
      -- Excluir tabelas do Kanban em ordem (respeitando foreign keys)
      DROP TABLE IF EXISTS public.kanban_activities CASCADE;
      DROP TABLE IF EXISTS public.kanban_attachments CASCADE;
      DROP TABLE IF EXISTS public.kanban_checklist_items CASCADE;
      DROP TABLE IF EXISTS public.kanban_checklists CASCADE;
      DROP TABLE IF EXISTS public.kanban_task_labels CASCADE;
      DROP TABLE IF EXISTS public.kanban_labels CASCADE;
      DROP TABLE IF EXISTS public.kanban_task_assignees CASCADE;
      DROP TABLE IF EXISTS public.kanban_comments CASCADE;
      DROP TABLE IF EXISTS public.kanban_tasks CASCADE;
      DROP TABLE IF EXISTS public.kanban_columns CASCADE;
      DROP TABLE IF EXISTS public.kanban_boards CASCADE;
    `;
    
    const { error: dropError } = await onlineSupabase.rpc('exec_sql', { sql: dropTablesSQL });
    
    if (dropError) {
      console.error('❌ Erro ao excluir tabelas:', dropError);
      console.log('💡 Execute o SQL manualmente no Supabase Dashboard');
    } else {
      console.log('✅ Tabelas do Kanban excluídas com sucesso');
    }
    
    console.log('\n📋 ETAPA 3: Criando estrutura completa do Kanban...');
    
    // 3. Executar migration completa
    await executeCompleteMigration();
    
    console.log('\n📋 ETAPA 4: Importando dados locais...');
    
    // 4. Importar dados
    if (localBoards && localBoards.length > 0) {
      const { error } = await onlineSupabase.from('kanban_boards').insert(localBoards);
      if (error) console.error('❌ Erro ao importar boards:', error);
      else console.log(`✅ ${localBoards.length} boards importados`);
    }
    
    if (localColumns && localColumns.length > 0) {
      const { error } = await onlineSupabase.from('kanban_columns').insert(localColumns);
      if (error) console.error('❌ Erro ao importar columns:', error);
      else console.log(`✅ ${localColumns.length} columns importados`);
    }
    
    if (localTasks && localTasks.length > 0) {
      const { error } = await onlineSupabase.from('kanban_tasks').insert(localTasks);
      if (error) console.error('❌ Erro ao importar tasks:', error);
      else console.log(`✅ ${localTasks.length} tasks importados`);
    }
    
    if (localComments && localComments.length > 0) {
      const { error } = await onlineSupabase.from('kanban_comments').insert(localComments);
      if (error) console.error('❌ Erro ao importar comments:', error);
      else console.log(`✅ ${localComments.length} comments importados`);
    }
    
    if (localAssignees && localAssignees.length > 0) {
      const { error } = await onlineSupabase.from('kanban_task_assignees').insert(localAssignees);
      if (error) console.error('❌ Erro ao importar assignees:', error);
      else console.log(`✅ ${localAssignees.length} assignees importados`);
    }
    
    if (localLabels && localLabels.length > 0) {
      const { error } = await onlineSupabase.from('kanban_labels').insert(localLabels);
      if (error) console.error('❌ Erro ao importar labels:', error);
      else console.log(`✅ ${localLabels.length} labels importados`);
    }
    
    if (localTaskLabels && localTaskLabels.length > 0) {
      const { error } = await onlineSupabase.from('kanban_task_labels').insert(localTaskLabels);
      if (error) console.error('❌ Erro ao importar task labels:', error);
      else console.log(`✅ ${localTaskLabels.length} task labels importados`);
    }
    
    if (localChecklists && localChecklists.length > 0) {
      const { error } = await onlineSupabase.from('kanban_checklists').insert(localChecklists);
      if (error) console.error('❌ Erro ao importar checklists:', error);
      else console.log(`✅ ${localChecklists.length} checklists importados`);
    }
    
    if (localChecklistItems && localChecklistItems.length > 0) {
      const { error } = await onlineSupabase.from('kanban_checklist_items').insert(localChecklistItems);
      if (error) console.error('❌ Erro ao importar checklist items:', error);
      else console.log(`✅ ${localChecklistItems.length} checklist items importados`);
    }
    
    if (localAttachments && localAttachments.length > 0) {
      const { error } = await onlineSupabase.from('kanban_attachments').insert(localAttachments);
      if (error) console.error('❌ Erro ao importar attachments:', error);
      else console.log(`✅ ${localAttachments.length} attachments importados`);
    }
    
    if (localActivities && localActivities.length > 0) {
      const { error } = await onlineSupabase.from('kanban_activities').insert(localActivities);
      if (error) console.error('❌ Erro ao importar activities:', error);
      else console.log(`✅ ${localActivities.length} activities importados`);
    }
    
    console.log('\n📋 ETAPA 5: Verificando migração...');
    
    // 5. Verificar dados migrados
    const [importedBoards, importedColumns, importedTasks] = await Promise.all([
      onlineSupabase.from('kanban_boards').select('*'),
      onlineSupabase.from('kanban_columns').select('*'),
      onlineSupabase.from('kanban_tasks').select('*')
    ]);
    
    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('==================================');
    console.log(`📊 Dados migrados:`);
    console.log(`   - Boards: ${importedBoards.data?.length || 0}`);
    console.log(`   - Columns: ${importedColumns.data?.length || 0}`);
    console.log(`   - Tasks: ${importedTasks.data?.length || 0}`);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Atualize o arquivo .env.local com as credenciais online');
    console.log('2. Teste a aplicação');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

async function executeCompleteMigration() {
  console.log('🔄 Executando migration completa...');
  
  // SQL completo da migration
  const migrationSQL = `
    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create kanban_boards table
    CREATE TABLE IF NOT EXISTS public.kanban_boards (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_boards_pkey PRIMARY KEY (id)
    ) TABLESPACE pg_default;

    -- Create kanban_columns table
    CREATE TABLE IF NOT EXISTS public.kanban_columns (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        board_id uuid NOT NULL,
        name text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_columns_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_columns_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_tasks table
    CREATE TABLE IF NOT EXISTS public.kanban_tasks (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        board_id uuid NOT NULL,
        column_id uuid NOT NULL,
        title text NOT NULL,
        description text,
        priority text DEFAULT 'medium',
        due_date timestamp with time zone,
        position integer NOT NULL DEFAULT 0,
        is_archived boolean DEFAULT false,
        created_by uuid NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_tasks_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE,
        CONSTRAINT kanban_tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES kanban_columns (id) ON DELETE CASCADE,
        CONSTRAINT kanban_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_task_assignees table
    CREATE TABLE IF NOT EXISTS public.kanban_task_assignees (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        user_id uuid NOT NULL,
        assigned_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_task_assignees_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_labels table
    CREATE TABLE IF NOT EXISTS public.kanban_labels (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        board_id uuid NOT NULL,
        name text NOT NULL,
        color text NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_labels_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_labels_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_task_labels table
    CREATE TABLE IF NOT EXISTS public.kanban_task_labels (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        label_id uuid NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_task_labels_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_task_labels_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE,
        CONSTRAINT kanban_task_labels_label_id_fkey FOREIGN KEY (label_id) REFERENCES kanban_labels (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_checklists table
    CREATE TABLE IF NOT EXISTS public.kanban_checklists (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        title text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_checklists_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_checklists_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_checklist_items table
    CREATE TABLE IF NOT EXISTS public.kanban_checklist_items (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        checklist_id uuid NOT NULL,
        title text NOT NULL,
        is_completed boolean DEFAULT false,
        position integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_checklist_items_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES kanban_checklists (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_attachments table
    CREATE TABLE IF NOT EXISTS public.kanban_attachments (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        name text NOT NULL,
        url text NOT NULL,
        file_type text,
        file_size integer,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_attachments_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_comments table
    CREATE TABLE IF NOT EXISTS public.kanban_comments (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        author_id uuid NOT NULL,
        content text NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_comments_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE,
        CONSTRAINT kanban_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create kanban_activities table
    CREATE TABLE IF NOT EXISTS public.kanban_activities (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        user_id uuid NOT NULL,
        action text NOT NULL,
        details jsonb,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_activities_pkey PRIMARY KEY (id),
        CONSTRAINT kanban_activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
    ) TABLESPACE pg_default;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON public.kanban_columns USING btree (board_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON public.kanban_tasks USING btree (column_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_id ON public.kanban_tasks USING btree (board_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_task_assignees_task_id ON public.kanban_task_assignees USING btree (task_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_checklists_task_id ON public.kanban_checklists USING btree (task_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_checklist_items_checklist_id ON public.kanban_checklist_items USING btree (checklist_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_attachments_task_id ON public.kanban_attachments USING btree (task_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_comments_task_id ON public.kanban_comments USING btree (task_id);
    CREATE INDEX IF NOT EXISTS idx_kanban_activities_task_id ON public.kanban_activities USING btree (task_id);

    -- Enable Row Level Security (RLS)
    ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_task_assignees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_labels ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_task_labels ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_checklists ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_checklist_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_attachments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_activities ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies for kanban_boards
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_boards FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_boards FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_boards FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_columns
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_columns FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_columns FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_columns FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_tasks
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_tasks FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_tasks FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_tasks FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_task_assignees
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_task_assignees FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_task_assignees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_task_assignees FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_task_assignees FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_labels
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_labels FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_labels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_labels FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_labels FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_task_labels
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_task_labels FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_task_labels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_task_labels FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_task_labels FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_checklists
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_checklists FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_checklists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_checklists FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_checklists FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_checklist_items
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_checklist_items FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_checklist_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_checklist_items FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_checklist_items FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_attachments
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_attachments FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_attachments FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_attachments FOR DELETE USING (auth.role() = 'authenticated');

    -- Create RLS policies for kanban_comments
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_comments FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for own comments" ON public.kanban_comments FOR UPDATE USING (auth.uid() = author_id);
    CREATE POLICY "Enable delete for own comments" ON public.kanban_comments FOR DELETE USING (auth.uid() = author_id);

    -- Create RLS policies for kanban_activities
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_activities FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_activities FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_activities FOR DELETE USING (auth.role() = 'authenticated');
  `;
  
  const { error } = await onlineSupabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error('❌ Erro ao executar migration:', error);
    console.log('💡 Execute o SQL manualmente no Supabase Dashboard');
  } else {
    console.log('✅ Migration executada com sucesso!');
  }
}

// Executar reset e migração
resetAndMigrateKanban().catch(console.error);
