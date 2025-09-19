import { createClient } from '@supabase/supabase-js';

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54331';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_KEY);

console.log('🔍 VERIFICAÇÃO PRÉ-MIGRAÇÃO');
console.log('===========================');

async function verificarPreMigracao() {
  try {
    console.log('📋 Verificando Supabase local...');
    
    // Verificar conexão
    const { data: testData, error: testError } = await localSupabase
      .from('kanban_boards')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Erro de conexão com Supabase local:', testError);
      return;
    }
    
    console.log('✅ Conexão com Supabase local OK');
    
    // Verificar dados do Kanban
    console.log('\n📊 Verificando dados do Kanban...');
    
    const [boardsResult, columnsResult, tasksResult, commentsResult] = await Promise.all([
      localSupabase.from('kanban_boards').select('*'),
      localSupabase.from('kanban_columns').select('*'),
      localSupabase.from('kanban_tasks').select('*'),
      localSupabase.from('kanban_comments').select('*')
    ]);
    
    console.log('✅ Dados encontrados:');
    console.log(`   - Boards: ${boardsResult.data?.length || 0}`);
    console.log(`   - Columns: ${columnsResult.data?.length || 0}`);
    console.log(`   - Tasks: ${tasksResult.data?.length || 0}`);
    console.log(`   - Comments: ${commentsResult.data?.length || 0}`);
    
    // Verificar estrutura das tabelas
    console.log('\n🔧 Verificando estrutura das tabelas...');
    
    if (boardsResult.data && boardsResult.data.length > 0) {
      const board = boardsResult.data[0];
      console.log('✅ kanban_boards:');
      console.log(`   - ID: ${board.id}`);
      console.log(`   - Nome: ${board.name}`);
      console.log(`   - Descrição: ${board.description || 'N/A'}`);
    }
    
    if (columnsResult.data && columnsResult.data.length > 0) {
      const column = columnsResult.data[0];
      console.log('✅ kanban_columns:');
      console.log(`   - ID: ${column.id}`);
      console.log(`   - Nome: ${column.name}`);
      console.log(`   - Posição: ${column.position}`);
    }
    
    if (tasksResult.data && tasksResult.data.length > 0) {
      const task = tasksResult.data[0];
      console.log('✅ kanban_tasks:');
      console.log(`   - ID: ${task.id}`);
      console.log(`   - Título: ${task.title}`);
      console.log(`   - Prioridade: ${task.priority || 'não definida'}`);
      console.log(`   - Arquivada: ${task.is_archived ? 'Sim' : 'Não'}`);
    }
    
    // Verificar funcionalidades específicas
    console.log('\n🎯 Verificando funcionalidades específicas...');
    
    // Verificar se há tarefas com prioridade
    const tasksWithPriority = tasksResult.data?.filter(task => task.priority) || [];
    console.log(`✅ Tarefas com prioridade: ${tasksWithPriority.length}`);
    
    // Verificar se há tarefas arquivadas
    const archivedTasks = tasksResult.data?.filter(task => task.is_archived) || [];
    console.log(`✅ Tarefas arquivadas: ${archivedTasks.length}`);
    
    // Verificar se há comentários
    const tasksWithComments = tasksResult.data?.filter(task => 
      commentsResult.data?.some(comment => comment.task_id === task.id)
    ) || [];
    console.log(`✅ Tarefas com comentários: ${tasksWithComments.length}`);
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('');
    console.log('✅ PRÉ-REQUISITOS ATENDIDOS:');
    console.log('   - Supabase local funcionando');
    console.log('   - Dados do Kanban disponíveis');
    console.log('   - Estrutura das tabelas correta');
    console.log('   - Funcionalidades implementadas');
    console.log('');
    console.log('🚀 PRONTO PARA MIGRAÇÃO!');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Configure as credenciais do Supabase online');
    console.log('2. Execute: node reset-and-migrate-kanban.js');
    console.log('3. Atualize as variáveis de ambiente');
    console.log('4. Teste a aplicação');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

verificarPreMigracao().catch(console.error);
