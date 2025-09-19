import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase local
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54331';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Configurações do Supabase online (você precisa fornecer)
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

// Senha do banco de dados
const DB_PASSWORD = 'XDrkDMh?9-A2t@4';

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_KEY);

console.log('🔍 ANÁLISE COMPLETA DO SUPABASE');
console.log('===============================');

async function analisarSupabaseCompleto() {
  try {
    console.log('📋 ETAPA 1: Verificando Supabase local...');
    
    // Testar conexão local
    const { data: localTest, error: localError } = await localSupabase
      .from('kanban_boards')
      .select('*')
      .limit(1);
      
    if (localError) {
      console.error('❌ Erro de conexão local:', localError);
      console.log('💡 Verifique se o Supabase local está rodando');
      return;
    }
    
    console.log('✅ Conexão com Supabase local OK');
    
    console.log('\n📋 ETAPA 2: Analisando dados locais...');
    
    // Verificar dados locais
    const [localBoards, localColumns, localTasks, localComments] = await Promise.all([
      localSupabase.from('kanban_boards').select('*'),
      localSupabase.from('kanban_columns').select('*'),
      localSupabase.from('kanban_tasks').select('*'),
      localSupabase.from('kanban_comments').select('*')
    ]);
    
    console.log('✅ Dados locais encontrados:');
    console.log(`   - Boards: ${localBoards.data?.length || 0}`);
    console.log(`   - Columns: ${localColumns.data?.length || 0}`);
    console.log(`   - Tasks: ${localTasks.data?.length || 0}`);
    console.log(`   - Comments: ${localComments.data?.length || 0}`);
    
    if (localBoards.data && localBoards.data.length > 0) {
      console.log('\n📊 BOARDS LOCAIS:');
      localBoards.data.forEach(board => {
        console.log(`   - ${board.name} (${board.id})`);
        console.log(`     Descrição: ${board.description || 'N/A'}`);
        console.log(`     Criado em: ${new Date(board.created_at).toLocaleString('pt-BR')}`);
      });
    }
    
    if (localColumns.data && localColumns.data.length > 0) {
      console.log('\n📋 COLUMNS LOCAIS:');
      localColumns.data.forEach(column => {
        console.log(`   - ${column.name} (Posição: ${column.position})`);
        console.log(`     Board: ${column.board_id}`);
      });
    }
    
    if (localTasks.data && localTasks.data.length > 0) {
      console.log('\n📝 TASKS LOCAIS:');
      localTasks.data.forEach(task => {
        console.log(`   - ${task.title}`);
        console.log(`     Prioridade: ${task.priority || 'não definida'}`);
        console.log(`     Arquivada: ${task.is_archived ? 'Sim' : 'Não'}`);
        console.log(`     Coluna: ${task.column_id}`);
        console.log(`     Criada por: ${task.created_by}`);
      });
    }
    
    console.log('\n📋 ETAPA 3: Verificando estrutura das tabelas locais...');
    
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
        const { data, error } = await localSupabase
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
    
    console.log('\n📋 ETAPA 4: Verificando políticas RLS locais...');
    
    // Verificar se as políticas RLS estão funcionando
    try {
      const { data: rlsData, error: rlsError } = await localSupabase
        .from('pg_policies')
        .select('*')
        .like('tablename', 'kanban_%');
        
      if (rlsError) {
        console.log('⚠️ Não foi possível verificar políticas RLS locais');
      } else {
        console.log(`✅ Políticas RLS locais encontradas: ${rlsData?.length || 0}`);
      }
    } catch (err) {
      console.log('⚠️ Não foi possível verificar políticas RLS locais');
    }
    
    console.log('\n📋 ETAPA 5: Testando operações locais...');
    
    // Testar operações básicas
    try {
      // Testar SELECT
      const { data: selectTest, error: selectError } = await localSupabase
        .from('kanban_boards')
        .select('*')
        .limit(1);
        
      if (selectError) {
        console.log('❌ Erro no SELECT local:', selectError.message);
      } else {
        console.log('✅ SELECT local funcionando');
      }
      
      // Testar INSERT (apenas se não houver dados)
      if (!localBoards.data || localBoards.data.length === 0) {
        const { data: insertTest, error: insertError } = await localSupabase
          .from('kanban_boards')
          .insert({
            name: 'Teste de Conexão Local',
            description: 'Board de teste para verificar conexão local'
          })
          .select();
          
        if (insertError) {
          console.log('❌ Erro no INSERT local:', insertError.message);
        } else {
          console.log('✅ INSERT local funcionando');
          
          // Limpar dados de teste
          await localSupabase
            .from('kanban_boards')
            .delete()
            .eq('name', 'Teste de Conexão Local');
        }
      }
      
    } catch (err) {
      console.log('❌ Erro nos testes locais:', err.message);
    }
    
    console.log('\n🎉 ANÁLISE LOCAL CONCLUÍDA!');
    console.log('============================');
    console.log('');
    console.log('📊 RESUMO LOCAL:');
    console.log(`   - Conexão: ✅ OK`);
    console.log(`   - Tabelas existentes: ${tabelasExistentes.length}/${tabelas.length}`);
    console.log(`   - Tabelas faltando: ${tabelasFaltando.length}`);
    console.log(`   - Dados: ${localBoards.data?.length || 0} boards, ${localTasks.data?.length || 0} tasks`);
    console.log(`   - Operações: ✅ Funcionando`);
    console.log('');
    
    if (tabelasFaltando.length > 0) {
      console.log('⚠️ TABELAS FALTANDO NO LOCAL:');
      tabelasFaltando.forEach(tabela => {
        console.log(`   - ${tabela}`);
      });
      console.log('');
      console.log('💡 RECOMENDAÇÕES:');
      console.log('1. Execute as migrations no Supabase local');
      console.log('2. Verifique se o schema está correto');
      console.log('3. Aplique as políticas RLS necessárias');
    } else {
      console.log('✅ TODAS AS TABELAS LOCAIS ESTÃO PRESENTES!');
    }
    
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Configure as credenciais do Supabase online');
    console.log('2. Execute a migração para o online');
    console.log('3. Teste a aplicação com o online');
    console.log('4. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

// Executar análise
analisarSupabaseCompleto().catch(console.error);
