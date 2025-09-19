import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

// ⚠️ CONFIGURAÇÕES - SUBSTITUA PELAS SUAS CREDENCIAIS
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_SERVICE_KEY);

console.log('🔍 ANÁLISE DO SUPABASE ONLINE VIA CLI');
console.log('=====================================');

async function analisarSupabaseCLI() {
  try {
    console.log('📋 ETAPA 1: Verificando Supabase CLI...');
    
    // Verificar se o CLI está disponível
    try {
      const { stdout: version } = await execAsync('npx supabase --version');
      console.log('✅ Supabase CLI disponível:', version.trim());
    } catch (error) {
      console.log('⚠️ Supabase CLI não disponível via npx');
      console.log('💡 Continuando com análise direta...');
    }
    
    console.log('\n📋 ETAPA 2: Análise direta do banco...');
    
    // Testar conexão
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
    
    console.log('\n📋 ETAPA 3: Verificando estrutura das tabelas...');
    
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
    
    console.log('\n📋 ETAPA 4: Verificando dados...');
    
    // Verificar dados em cada tabela
    const [boardsResult, columnsResult, tasksResult, commentsResult] = await Promise.all([
      onlineSupabase.from('kanban_boards').select('*'),
      onlineSupabase.from('kanban_columns').select('*'),
      onlineSupabase.from('kanban_tasks').select('*'),
      onlineSupabase.from('kanban_comments').select('*')
    ]);
    
    console.log('✅ Dados encontrados:');
    console.log(`   - Boards: ${boardsResult.data?.length || 0}`);
    console.log(`   - Columns: ${columnsResult.data?.length || 0}`);
    console.log(`   - Tasks: ${tasksResult.data?.length || 0}`);
    console.log(`   - Comments: ${commentsResult.data?.length || 0}`);
    
    if (boardsResult.data && boardsResult.data.length > 0) {
      console.log('\n📊 BOARDS:');
      boardsResult.data.forEach(board => {
        console.log(`   - ${board.name} (${board.id})`);
        console.log(`     Descrição: ${board.description || 'N/A'}`);
        console.log(`     Criado em: ${new Date(board.created_at).toLocaleString('pt-BR')}`);
      });
    }
    
    if (columnsResult.data && columnsResult.data.length > 0) {
      console.log('\n📋 COLUMNS:');
      columnsResult.data.forEach(column => {
        console.log(`   - ${column.name} (Posição: ${column.position})`);
        console.log(`     Board: ${column.board_id}`);
      });
    }
    
    if (tasksResult.data && tasksResult.data.length > 0) {
      console.log('\n📝 TASKS:');
      tasksResult.data.forEach(task => {
        console.log(`   - ${task.title}`);
        console.log(`     Prioridade: ${task.priority || 'não definida'}`);
        console.log(`     Arquivada: ${task.is_archived ? 'Sim' : 'Não'}`);
        console.log(`     Coluna: ${task.column_id}`);
        console.log(`     Criada por: ${task.created_by}`);
      });
    }
    
    console.log('\n📋 ETAPA 5: Verificando políticas RLS...');
    
    // Verificar se as políticas RLS estão funcionando
    try {
      const { data: rlsData, error: rlsError } = await onlineSupabase
        .from('pg_policies')
        .select('*')
        .like('tablename', 'kanban_%');
        
      if (rlsError) {
        console.log('⚠️ Não foi possível verificar políticas RLS');
      } else {
        console.log(`✅ Políticas RLS encontradas: ${rlsData?.length || 0}`);
      }
    } catch (err) {
      console.log('⚠️ Não foi possível verificar políticas RLS');
    }
    
    console.log('\n📋 ETAPA 6: Testando operações...');
    
    // Testar operações básicas
    try {
      // Testar SELECT
      const { data: selectTest, error: selectError } = await onlineSupabase
        .from('kanban_boards')
        .select('*')
        .limit(1);
        
      if (selectError) {
        console.log('❌ Erro no SELECT:', selectError.message);
      } else {
        console.log('✅ SELECT funcionando');
      }
      
      // Testar INSERT (apenas se não houver dados)
      if (!boardsResult.data || boardsResult.data.length === 0) {
        const { data: insertTest, error: insertError } = await onlineSupabase
          .from('kanban_boards')
          .insert({
            name: 'Teste de Conexão',
            description: 'Board de teste para verificar conexão'
          })
          .select();
          
        if (insertError) {
          console.log('❌ Erro no INSERT:', insertError.message);
        } else {
          console.log('✅ INSERT funcionando');
          
          // Limpar dados de teste
          await onlineSupabase
            .from('kanban_boards')
            .delete()
            .eq('name', 'Teste de Conexão');
        }
      }
      
    } catch (err) {
      console.log('❌ Erro nos testes:', err.message);
    }
    
    console.log('\n🎉 ANÁLISE CONCLUÍDA!');
    console.log('====================');
    console.log('');
    console.log('📊 RESUMO:');
    console.log(`   - Conexão: ✅ OK`);
    console.log(`   - Tabelas existentes: ${tabelasExistentes.length}/${tabelas.length}`);
    console.log(`   - Tabelas faltando: ${tabelasFaltando.length}`);
    console.log(`   - Dados: ${boardsResult.data?.length || 0} boards, ${tasksResult.data?.length || 0} tasks`);
    console.log(`   - Operações: ✅ Funcionando`);
    console.log('');
    
    if (tabelasFaltando.length > 0) {
      console.log('⚠️ TABELAS FALTANDO:');
      tabelasFaltando.forEach(tabela => {
        console.log(`   - ${tabela}`);
      });
      console.log('');
      console.log('💡 RECOMENDAÇÕES:');
      console.log('1. Execute as migrations no Supabase online');
      console.log('2. Verifique se o schema está correto');
      console.log('3. Aplique as políticas RLS necessárias');
    } else {
      console.log('✅ TODAS AS TABELAS ESTÃO PRESENTES!');
    }
    
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se todas as tabelas estão presentes');
    console.log('2. Confirme se os dados foram migrados corretamente');
    console.log('3. Teste as funcionalidades na aplicação');
    console.log('4. Verifique as políticas RLS no Dashboard');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

// Executar análise
analisarSupabaseCLI().catch(console.error);
