import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configurações do Supabase online
const ONLINE_SUPABASE_URL = 'https://rncowiwstzumxruaojvq.supabase.co';
const ONLINE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_ANON_KEY);

console.log('📥 IMPORTANDO DADOS DO KANBAN PARA SUPABASE ONLINE');
console.log('==================================================');

async function importKanbanData() {
  try {
    console.log('📂 Lendo arquivo de exportação...');
    
    // Ler arquivo de exportação
    const exportFile = 'kanban-export-2025-09-19.json';
    const exportData = JSON.parse(readFileSync(exportFile, 'utf8'));
    
    console.log('✅ Dados carregados:');
    console.log(`   - Boards: ${exportData.boards.length}`);
    console.log(`   - Columns: ${exportData.columns.length}`);
    console.log(`   - Tasks: ${exportData.tasks.length}`);
    console.log(`   - Comments: ${exportData.comments.length}`);
    
    console.log('\n🔄 Importando boards...');
    if (exportData.boards.length > 0) {
      const { error: boardsError } = await onlineSupabase
        .from('kanban_boards')
        .upsert(exportData.boards);
        
      if (boardsError) {
        console.error('❌ Erro ao importar boards:', boardsError);
      } else {
        console.log(`✅ ${exportData.boards.length} boards importados`);
      }
    }
    
    console.log('\n🔄 Importando columns...');
    if (exportData.columns.length > 0) {
      const { error: columnsError } = await onlineSupabase
        .from('kanban_columns')
        .upsert(exportData.columns);
        
      if (columnsError) {
        console.error('❌ Erro ao importar columns:', columnsError);
      } else {
        console.log(`✅ ${exportData.columns.length} columns importados`);
      }
    }
    
    console.log('\n🔄 Importando tasks...');
    if (exportData.tasks.length > 0) {
      const { error: tasksError } = await onlineSupabase
        .from('kanban_tasks')
        .upsert(exportData.tasks);
        
      if (tasksError) {
        console.error('❌ Erro ao importar tasks:', tasksError);
      } else {
        console.log(`✅ ${exportData.tasks.length} tasks importados`);
      }
    }
    
    console.log('\n🔄 Importando comments...');
    if (exportData.comments.length > 0) {
      const { error: commentsError } = await onlineSupabase
        .from('kanban_comments')
        .upsert(exportData.comments);
        
      if (commentsError) {
        console.error('❌ Erro ao importar comments:', commentsError);
      } else {
        console.log(`✅ ${exportData.comments.length} comments importados`);
      }
    }
    
    console.log('\n🔍 Verificando importação...');
    
    // Verificar dados importados
    const [importedBoards, importedColumns, importedTasks, importedComments] = await Promise.all([
      onlineSupabase.from('kanban_boards').select('*'),
      onlineSupabase.from('kanban_columns').select('*'),
      onlineSupabase.from('kanban_tasks').select('*'),
      onlineSupabase.from('kanban_comments').select('*')
    ]);
    
    console.log('\n✅ DADOS IMPORTADOS COM SUCESSO:');
    console.log(`   - Boards: ${importedBoards.data?.length || 0}`);
    console.log(`   - Columns: ${importedColumns.data?.length || 0}`);
    console.log(`   - Tasks: ${importedTasks.data?.length || 0}`);
    console.log(`   - Comments: ${importedComments.data?.length || 0}`);
    
    console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
    console.log('========================');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Atualize o arquivo .env.local com as credenciais do Supabase online');
    console.log('2. Teste a aplicação');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  }
}

importKanbanData().catch(console.error);

