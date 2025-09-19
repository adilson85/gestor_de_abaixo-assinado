import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

// ⚠️ CONFIGURAÇÕES - SUBSTITUA PELAS SUAS CREDENCIAIS
const ONLINE_SUPABASE_URL = 'SUA_URL_DO_SUPABASE_ONLINE';
const ONLINE_SERVICE_KEY = 'SUA_SERVICE_KEY_DO_SUPABASE_ONLINE';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_SERVICE_KEY);

console.log('🔍 VERIFICAÇÃO DO SUPABASE ONLINE VIA CLI');
console.log('=========================================');

async function verificarSupabaseCLI() {
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
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
    console.log('=========================');
    console.log('');
    console.log('📊 RESUMO:');
    console.log(`   - Conexão: ✅ OK`);
    console.log(`   - Tabelas existentes: ${tabelasExistentes.length}/${tabelas.length}`);
    console.log(`   - Tabelas faltando: ${tabelasFaltando.length}`);
    console.log(`   - Dados: ${boards.data?.length || 0} boards, ${tasks.data?.length || 0} tasks`);
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
    console.log('1. Configure as credenciais no .env.local');
    console.log('2. Teste a aplicação: npm run dev');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    console.log('💡 Verifique as credenciais do Supabase online');
  }
}

// Executar verificação
verificarSupabaseCLI().catch(console.error);
