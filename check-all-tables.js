import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rncowiwstzumxruaojvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllTables() {
  console.log('🔍 VERIFICANDO TODAS AS TABELAS DO BANCO\n');
  console.log('='  .repeat(80));

  const tables = [
    // Principais
    { name: 'petitions', description: 'Abaixo-assinados', showSample: true },
    { name: 'signatures', description: 'Assinaturas', showSample: true },

    // Kanban
    { name: 'kanban_boards', description: 'Boards Kanban', showSample: true },
    { name: 'kanban_columns', description: 'Colunas Kanban', showSample: true },
    { name: 'kanban_tasks', description: 'Tarefas Kanban', showSample: true },
    { name: 'kanban_labels', description: 'Labels Kanban', showSample: false },
    { name: 'kanban_task_labels', description: 'Task Labels', showSample: false },
    { name: 'kanban_task_assignees', description: 'Assignees', showSample: false },
    { name: 'kanban_checklists', description: 'Checklists', showSample: false },
    { name: 'kanban_checklist_items', description: 'Checklist Items', showSample: false },
    { name: 'kanban_attachments', description: 'Anexos', showSample: false },
    { name: 'kanban_comments', description: 'Comentários', showSample: false },
    { name: 'kanban_activities', description: 'Atividades', showSample: false },
    { name: 'kanban_column_deadlines', description: 'Deadlines', showSample: false },

    // Recursos e Admin
    { name: 'petition_resources', description: 'Recursos de Petitions', showSample: true },
    { name: 'admin_users', description: 'Usuários Admin', showSample: true },

    // Logs
    { name: 'audit_logs', description: 'Logs de Auditoria', showSample: false },
    { name: 'error_logs', description: 'Logs de Erro', showSample: false },
  ];

  const results = [];

  for (const table of tables) {
    try {
      // Contar registros
      const { count, error: countError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        results.push({
          table: table.name,
          description: table.description,
          count: '❌ ERRO',
          error: countError.message,
          sample: null
        });
        continue;
      }

      // Buscar sample se necessário
      let sample = null;
      if (table.showSample && count > 0) {
        const { data, error: dataError } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        if (!dataError && data && data.length > 0) {
          sample = data[0];
        }
      }

      results.push({
        table: table.name,
        description: table.description,
        count: count || 0,
        error: null,
        sample
      });

    } catch (error) {
      results.push({
        table: table.name,
        description: table.description,
        count: '❌ EXCEÇÃO',
        error: error.message,
        sample: null
      });
    }
  }

  // Exibir resultados
  console.log('\n📊 RESUMO GERAL:\n');

  // Tabelas principais
  console.log('🗂️  TABELAS PRINCIPAIS:');
  results.filter(r => ['petitions', 'signatures', 'petition_resources', 'admin_users'].includes(r.table))
    .forEach(r => printTableResult(r));

  console.log('\n📋 KANBAN:');
  results.filter(r => r.table.startsWith('kanban_'))
    .forEach(r => printTableResult(r));

  console.log('\n📝 LOGS:');
  results.filter(r => r.table.includes('_logs'))
    .forEach(r => printTableResult(r));

  console.log('\n' + '='.repeat(80));

  // Estatísticas
  const totalTables = results.length;
  const tablesWithData = results.filter(r => typeof r.count === 'number' && r.count > 0).length;
  const emptyTables = results.filter(r => r.count === 0).length;
  const errorTables = results.filter(r => typeof r.count === 'string').length;

  console.log('\n📈 ESTATÍSTICAS:');
  console.log(`   Total de tabelas: ${totalTables}`);
  console.log(`   ✅ Com dados: ${tablesWithData}`);
  console.log(`   ⚪ Vazias: ${emptyTables}`);
  console.log(`   ❌ Com erro: ${errorTables}`);

  // Detalhes de samples
  console.log('\n' + '='.repeat(80));
  console.log('\n🔬 AMOSTRAS DE DADOS:\n');

  results.filter(r => r.sample).forEach(r => {
    console.log(`📄 ${r.description.toUpperCase()} (${r.table}):`);
    console.log(JSON.stringify(r.sample, null, 2));
    console.log('');
  });

  // Problemas identificados
  console.log('='.repeat(80));
  console.log('\n⚠️  PROBLEMAS IDENTIFICADOS:\n');

  const kanbanBoardsResult = results.find(r => r.table === 'kanban_boards');
  if (kanbanBoardsResult && kanbanBoardsResult.count === 0) {
    console.log('❌ CRÍTICO: kanban_boards está VAZIO!');
    console.log('   → Kanban não funcionará sem um board');
    console.log('   → Execute o SQL de inicialização do board');
  }

  const petitionsResult = results.find(r => r.table === 'petitions');
  if (petitionsResult && petitionsResult.count === 0) {
    console.log('⚠️  ATENÇÃO: petitions está VAZIO!');
    console.log('   → Não há abaixo-assinados cadastrados');
  } else if (petitionsResult && petitionsResult.count > 0) {
    console.log(`✅ OK: ${petitionsResult.count} petition(s) cadastrada(s)`);
  }

  const signaturesResult = results.find(r => r.table === 'signatures');
  if (signaturesResult && signaturesResult.count === 0) {
    console.log('⚠️  ATENÇÃO: signatures está VAZIO!');
    console.log('   → Nenhuma assinatura foi coletada ainda');
  } else if (signaturesResult && signaturesResult.count > 0) {
    console.log(`✅ OK: ${signaturesResult.count} assinatura(s) registrada(s)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verificação concluída!\n');
}

function printTableResult(result) {
  const icon = result.count === 0 ? '⚪' :
               typeof result.count === 'number' ? '✅' : '❌';
  const countStr = typeof result.count === 'number' ?
                   `${result.count} registro(s)` :
                   result.count;

  console.log(`   ${icon} ${result.description.padEnd(30)} → ${countStr}`);

  if (result.error) {
    console.log(`      └─ Erro: ${result.error}`);
  }
}

checkAllTables().catch(console.error);
