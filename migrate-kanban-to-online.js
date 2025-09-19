import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase LOCAL (fonte)
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54331';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Configurações do Supabase ONLINE (destino)
// ⚠️ SUBSTITUA PELAS SUAS CREDENCIAIS ONLINE
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_KEY);
const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_SERVICE_KEY);

console.log('🚀 INICIANDO MIGRAÇÃO KANBAN PARA SUPABASE ONLINE');
console.log('================================================');

async function migrateKanbanToOnline() {
  try {
    console.log('📋 ETAPA 1: Verificando dados locais...');
    
    // 1. Verificar dados locais
    const { data: localBoards, error: boardsError } = await localSupabase
      .from('kanban_boards')
      .select('*');
      
    if (boardsError) {
      console.error('❌ Erro ao buscar boards locais:', boardsError);
      return;
    }
    
    const { data: localColumns, error: columnsError } = await localSupabase
      .from('kanban_columns')
      .select('*');
      
    if (columnsError) {
      console.error('❌ Erro ao buscar columns locais:', columnsError);
      return;
    }
    
    const { data: localTasks, error: tasksError } = await localSupabase
      .from('kanban_tasks')
      .select('*');
      
    if (tasksError) {
      console.error('❌ Erro ao buscar tasks locais:', tasksError);
      return;
    }
    
    console.log(`✅ Dados locais encontrados:`);
    console.log(`   - Boards: ${localBoards?.length || 0}`);
    console.log(`   - Columns: ${localColumns?.length || 0}`);
    console.log(`   - Tasks: ${localTasks?.length || 0}`);
    
    console.log('\n📋 ETAPA 2: Criando schema no Supabase online...');
    
    // 2. Executar migrations no Supabase online
    await executeMigrationsOnline();
    
    console.log('\n📋 ETAPA 3: Migrando dados...');
    
    // 3. Migrar boards
    if (localBoards && localBoards.length > 0) {
      console.log('🔄 Migrando boards...');
      for (const board of localBoards) {
        const { error } = await onlineSupabase
          .from('kanban_boards')
          .upsert({
            id: board.id,
            name: board.name,
            description: board.description,
            created_at: board.created_at,
            updated_at: board.updated_at
          });
          
        if (error) {
          console.error(`❌ Erro ao migrar board ${board.name}:`, error);
        } else {
          console.log(`✅ Board migrado: ${board.name}`);
        }
      }
    }
    
    // 4. Migrar columns
    if (localColumns && localColumns.length > 0) {
      console.log('🔄 Migrando columns...');
      for (const column of localColumns) {
        const { error } = await onlineSupabase
          .from('kanban_columns')
          .upsert({
            id: column.id,
            board_id: column.board_id,
            name: column.name,
            position: column.position,
            created_at: column.created_at,
            updated_at: column.updated_at
          });
          
        if (error) {
          console.error(`❌ Erro ao migrar column ${column.name}:`, error);
        } else {
          console.log(`✅ Column migrado: ${column.name}`);
        }
      }
    }
    
    // 5. Migrar tasks
    if (localTasks && localTasks.length > 0) {
      console.log('🔄 Migrando tasks...');
      for (const task of localTasks) {
        const { error } = await onlineSupabase
          .from('kanban_tasks')
          .upsert({
            id: task.id,
            board_id: task.board_id,
            column_id: task.column_id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            position: task.position,
            is_archived: task.is_archived,
            created_by: task.created_by,
            created_at: task.created_at,
            updated_at: task.updated_at
          });
          
        if (error) {
          console.error(`❌ Erro ao migrar task ${task.title}:`, error);
        } else {
          console.log(`✅ Task migrado: ${task.title}`);
        }
      }
    }
    
    console.log('\n📋 ETAPA 4: Verificando migração...');
    
    // 6. Verificar dados migrados
    const { data: onlineBoards, error: onlineBoardsError } = await onlineSupabase
      .from('kanban_boards')
      .select('*');
      
    const { data: onlineColumns, error: onlineColumnsError } = await onlineSupabase
      .from('kanban_columns')
      .select('*');
      
    const { data: onlineTasks, error: onlineTasksError } = await onlineSupabase
      .from('kanban_tasks')
      .select('*');
    
    console.log(`✅ Dados migrados para online:`);
    console.log(`   - Boards: ${onlineBoards?.length || 0}`);
    console.log(`   - Columns: ${onlineColumns?.length || 0}`);
    console.log(`   - Tasks: ${onlineTasks?.length || 0}`);
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Atualize as variáveis de ambiente (.env.local)');
    console.log('2. Teste a aplicação com o Supabase online');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

async function executeMigrationsOnline() {
  console.log('🔄 Executando migrations no Supabase online...');
  
  // SQL para criar as tabelas do Kanban
  const migrationSQL = `
    -- Criar tabela kanban_boards
    CREATE TABLE IF NOT EXISTS public.kanban_boards (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT kanban_boards_pkey PRIMARY KEY (id)
    ) TABLESPACE pg_default;

    -- Criar tabela kanban_columns
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

    -- Criar tabela kanban_tasks
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

    -- Criar tabela kanban_comments
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

    -- Habilitar RLS
    ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;

    -- Criar políticas RLS
    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_boards FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_boards FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_boards FOR DELETE USING (auth.role() = 'authenticated');

    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_columns FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_columns FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_columns FOR DELETE USING (auth.role() = 'authenticated');

    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_tasks FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for authenticated users" ON public.kanban_tasks FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable delete for authenticated users" ON public.kanban_tasks FOR DELETE USING (auth.role() = 'authenticated');

    CREATE POLICY "Enable read access for authenticated users" ON public.kanban_comments FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Enable insert for authenticated users" ON public.kanban_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Enable update for own comments" ON public.kanban_comments FOR UPDATE USING (auth.uid() = author_id);
    CREATE POLICY "Enable delete for own comments" ON public.kanban_comments FOR DELETE USING (auth.uid() = author_id);
  `;
  
  // Executar SQL no Supabase online
  const { error } = await onlineSupabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error('❌ Erro ao executar migrations:', error);
    console.log('💡 Execute o SQL manualmente no Supabase Dashboard');
  } else {
    console.log('✅ Migrations executadas com sucesso!');
  }
}

// Executar migração
migrateKanbanToOnline().catch(console.error);

