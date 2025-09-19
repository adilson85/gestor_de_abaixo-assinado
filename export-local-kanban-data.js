import { createClient } from '@supabase/supabase-js';

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54331';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_KEY);

console.log('📤 EXPORTANDO DADOS DO KANBAN LOCAL');
console.log('===================================');

async function exportKanbanData() {
  try {
    console.log('🔍 Buscando dados do Kanban...');
    
    // Buscar todos os dados
    const [boardsResult, columnsResult, tasksResult, commentsResult] = await Promise.all([
      localSupabase.from('kanban_boards').select('*'),
      localSupabase.from('kanban_columns').select('*'),
      localSupabase.from('kanban_tasks').select('*'),
      localSupabase.from('kanban_comments').select('*')
    ]);
    
    if (boardsResult.error) {
      console.error('❌ Erro ao buscar boards:', boardsResult.error);
      return;
    }
    
    if (columnsResult.error) {
      console.error('❌ Erro ao buscar columns:', columnsResult.error);
      return;
    }
    
    if (tasksResult.error) {
      console.error('❌ Erro ao buscar tasks:', tasksResult.error);
      return;
    }
    
    if (commentsResult.error) {
      console.error('❌ Erro ao buscar comments:', commentsResult.error);
      return;
    }
    
    const exportData = {
      boards: boardsResult.data || [],
      columns: columnsResult.data || [],
      tasks: tasksResult.data || [],
      comments: commentsResult.data || [],
      exported_at: new Date().toISOString(),
      version: '2.0.0'
    };
    
    console.log('✅ Dados exportados:');
    console.log(`   - Boards: ${exportData.boards.length}`);
    console.log(`   - Columns: ${exportData.columns.length}`);
    console.log(`   - Tasks: ${exportData.tasks.length}`);
    console.log(`   - Comments: ${exportData.comments.length}`);
    
    // Salvar em arquivo JSON
    const fs = await import('fs');
    const filename = `kanban-export-${new Date().toISOString().split('T')[0]}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`\n💾 Dados salvos em: ${filename}`);
    console.log('\n📋 RESUMO DOS DADOS:');
    
    if (exportData.boards.length > 0) {
      console.log('\n📊 BOARDS:');
      exportData.boards.forEach(board => {
        console.log(`   - ${board.name} (${board.id})`);
      });
    }
    
    if (exportData.columns.length > 0) {
      console.log('\n📋 COLUMNS:');
      exportData.columns.forEach(column => {
        console.log(`   - ${column.name} (Board: ${column.board_id})`);
      });
    }
    
    if (exportData.tasks.length > 0) {
      console.log('\n📝 TASKS:');
      exportData.tasks.forEach(task => {
        console.log(`   - ${task.title} (Prioridade: ${task.priority || 'não definida'})`);
      });
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Use este arquivo JSON para importar no Supabase online');
    console.log('2. Execute o script de migração');
    console.log('3. Atualize as variáveis de ambiente');
    
  } catch (error) {
    console.error('❌ Erro durante a exportação:', error);
  }
}

exportKanbanData().catch(console.error);

