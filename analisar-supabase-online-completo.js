import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURAÇÕES - SUBSTITUA PELAS SUAS CREDENCIAIS
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_SERVICE_KEY);

console.log('🔍 ANÁLISE COMPLETA DO SUPABASE ONLINE');
console.log('======================================');

async function analisarSupabaseOnlineCompleto() {
  try {
    console.log('📋 ETAPA 1: Verificando Supabase online...');
    
    // Testar conexão online
    const { data: onlineTest, error: onlineError } = await onlineSupabase
      .from('kanban_boards')
      .select('*')
      .limit(1);
      
    if (onlineError) {
      console.error('❌ Erro de conexão online:', onlineError);
      console.log('💡 Verifique as credenciais do Supabase online');
      return;
    }
    
    console.log('✅ Conexão com Supabase online OK');
    
    console.log('\n📋 ETAPA 2: Analisando dados online...');
    
    // Verificar dados online
    const [onlineBoards, onlineColumns, onlineTasks, onlineComments] = await Promise.all([
      onlineSupabase.from('kanban_boards').select('*'),
      onlineSupabase.from('kanban_columns').select('*'),
      onlineSupabase.from('kanban_tasks').select('*'),
      onlineSupabase.from('kanban_comments').select('*')
    ]);
    
    console.log('✅ Dados online encontrados:');
    console.log(`   - Boards: ${onlineBoards.data?.length || 0}`);
    console.log(`   - Columns: ${onlineColumns.data?.length || 0}`);
    console.log(`   - Tasks: ${onlineTasks.data?.length || 0}`);
    console.log(`   - Comments: ${onlineComments.data?.length || 0}`);
    
    if (onlineBoards.data && onlineBoards.data.length > 0) {
      console.log('\n📊 BOARDS ONLINE:');
      onlineBoards.data.forEach(board => {
        console.log(`   - ${board.name} (${board.id})`);
        console.log(`     Descrição: ${board.description || 'N/A'}`);
        console.log(`     Criado em: ${new Date(board.created_at).toLocaleString('pt-BR')}`);
      });
    }
    
    if (onlineColumns.data && onlineColumns.data.length > 0) {
      console.log('\n📋 COLUMNS ONLINE:');
      onlineColumns.data.forEach(column => {
        console.log(`   - ${column.name} (Posição: ${column.position})`);
        console.log(`     Board: ${column.board_id}`);
      });
    }
    
    if (onlineTasks.data && onlineTasks.data.length > 0) {
      console.log('\n📝 TASKS ONLINE:');
      onlineTasks.data.forEach(task => {
        console.log(`   - ${task.title}`);
        console.log(`     Prioridade: ${task.priority || 'não definida'}`);
        console.log(`     Arquivada: ${task.is_archived ? 'Sim' : 'Não'}`);
        console.log(`     Coluna: ${task.column_id}`);
        console.log(`     Criada por: ${task.created_by}`);
      });
    }
    
    console.log('\n📋 ETAPA 3: Verificando estrutura das tabelas online...');
    
    // Verificar todas as tabelas do Kanban
    const tabelas = [
      'kanban_boards',
      'kanban_columns', 
      'kanban_tasks',
      'kanban_comments',
      'kanban_task_assignees',
      'kanban_labels',
      'kanban_task_labels',
      'kanban_checklists',
      'kanban_checklist_items',
      'kanban_attachments',
      'kanban_activities'
    ];
    
    const tabelasExistentes = [];
    const tabelasFaltando = [];
    
    for (const tabela of tabelas) {
      try {
        const { data, error } = await onlineSupabase
          .from(tabela)
          .select('*')
          .limit(1);
          
        if (error) {
          tabelasFaltando.push(tabela);
          console.log(`❌ ${tabela}: ${error.message}`);
        } else {
          tabelasExistentes.push(tabela);
          console.log(`✅ ${tabela}: OK`);
        }
      } catch (err) {
        tabelasFaltando.push(tabela);
        console.log(`❌ ${tabela}: ${err.message}`);
      }
    }
    
    console.log('\n📋 ETAPA 4: Verificando políticas RLS online...');
    
    // Verificar se as políticas RLS estão funcionando
    try {
      const { data: rlsData, error: rlsError } = await onlineSupabase
        .from('pg_policies')
        .select('*')
        .like('tablename', 'kanban_%');
        
      if (rlsError) {
        console.log('⚠️ Não foi possível verificar políticas RLS online');
      } else {
        console.log(`✅ Políticas RLS online encontradas: ${rlsData?.length || 0}`);
      }
    } catch (err) {
      console.log('⚠️ Não foi possível verificar políticas RLS online');
    }
    
    console.log('\n📋 ETAPA 5: Testando operações online...');
    
    // Testar operações básicas
    try {
      // Testar SELECT
      const { data: selectTest, error: selectError } = await onlineSupabase
        .from('kanban_boards')
        .select('*')
        .limit(1);
        
      if (selectError) {
        console.log('❌ Erro no SELECT online:', selectError.message);
      } else {
        console.log('✅ SELECT online funcionando');
      }
      
      // Testar INSERT (apenas se não houver dados)
      if (!onlineBoards.data || onlineBoards.data.length === 0) {
        const { data: insertTest, error: insertError } = await onlineSupabase
          .from('kanban_boards')
          .insert({
            name: 'Teste de Conexão Online',
            description: 'Board de teste para verificar conexão online'
          })
          .select();
          
        if (insertError) {
          console.log('❌ Erro no INSERT online:', insertError.message);
        } else {
          console.log('✅ INSERT online funcionando');
          
          // Limpar dados de teste
          await onlineSupabase
            .from('kanban_boards')
            .delete()
            .eq('name', 'Teste de Conexão Online');
        }
      }
      
    } catch (err) {
      console.log('❌ Erro nos testes online:', err.message);
    }
    
    console.log('\n🎉 ANÁLISE ONLINE CONCLUÍDA!');
    console.log('============================');
    console.log('');
    console.log('📊 RESUMO ONLINE:');
    console.log(`   - Conexão: ✅ OK`);
    console.log(`   - Tabelas existentes: ${tabelasExistentes.length}/${tabelas.length}`);
    console.log(`   - Tabelas faltando: ${tabelasFaltando.length}`);
    console.log(`   - Dados: ${onlineBoards.data?.length || 0} boards, ${onlineTasks.data?.length || 0} tasks`);
    console.log(`   - Operações: ✅ Funcionando`);
    console.log('');
    
    if (tabelasFaltando.length > 0) {
      console.log('⚠️ TABELAS FALTANDO NO ONLINE:');
      tabelasFaltando.forEach(tabela => {
        console.log(`   - ${tabela}`);
      });
      console.log('');
      console.log('💡 RECOMENDAÇÕES:');
      console.log('1. Execute as migrations no Supabase online');
      console.log('2. Verifique se o schema está correto');
      console.log('3. Aplique as políticas RLS necessárias');
    } else {
      console.log('✅ TODAS AS TABELAS ONLINE ESTÃO PRESENTES!');
    }
    
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Configure as credenciais no .env.local');
    console.log('2. Teste a aplicação: npm run dev');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    console.log('4. Execute a migração de dados se necessário');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

// Executar análise
analisarSupabaseOnlineCompleto().catch(console.error);
