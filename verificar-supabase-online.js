import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURAÇÕES - SUBSTITUA PELAS SUAS CREDENCIAIS
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_SERVICE_KEY);

console.log('🔍 VERIFICAÇÃO DO SUPABASE ONLINE');
console.log('=================================');

async function verificarSupabaseOnline() {
  try {
    console.log('📋 Verificando conexão...');
    
    // Testar conexão básica
    const { data: testData, error: testError } = await onlineSupabase
      .from('kanban_boards')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('❌ Erro de conexão:', testError);
      console.log('💡 Verifique as credenciais do Supabase online');
      return;
    }
    
    console.log('✅ Conexão com Supabase online OK');
    
    console.log('\n📊 Verificando dados...');
    
    // Verificar dados básicos
    const [boards, columns, tasks, comments] = await Promise.all([
      onlineSupabase.from('kanban_boards').select('*'),
      onlineSupabase.from('kanban_columns').select('*'),
      onlineSupabase.from('kanban_tasks').select('*'),
      onlineSupabase.from('kanban_comments').select('*')
    ]);
    
    console.log('✅ Dados encontrados:');
    console.log(`   - Boards: ${boards.data?.length || 0}`);
    console.log(`   - Columns: ${columns.data?.length || 0}`);
    console.log(`   - Tasks: ${tasks.data?.length || 0}`);
    console.log(`   - Comments: ${comments.data?.length || 0}`);
    
    if (boards.data && boards.data.length > 0) {
      console.log('\n📊 BOARDS:');
      boards.data.forEach(board => {
        console.log(`   - ${board.name} (${board.id})`);
      });
    }
    
    if (columns.data && columns.data.length > 0) {
      console.log('\n📋 COLUMNS:');
      columns.data.forEach(column => {
        console.log(`   - ${column.name} (Posição: ${column.position})`);
      });
    }
    
    if (tasks.data && tasks.data.length > 0) {
      console.log('\n📝 TASKS:');
      tasks.data.forEach(task => {
        console.log(`   - ${task.title} (Prioridade: ${task.priority || 'não definida'})`);
      });
    }
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
    console.log('=========================');
    console.log('');
    console.log('✅ SUPABASE ONLINE FUNCIONANDO!');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Configure as credenciais no .env.local');
    console.log('2. Teste a aplicação: npm run dev');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    console.log('💡 Verifique as credenciais do Supabase online');
  }
}

// Executar verificação
verificarSupabaseOnline().catch(console.error);
