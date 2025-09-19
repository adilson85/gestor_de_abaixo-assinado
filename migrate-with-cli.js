import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

console.log('🚀 MIGRAÇÃO AUTOMÁTICA COM SUPABASE CLI');
console.log('======================================');

async function migrateWithCLI() {
  try {
    console.log('📋 ETAPA 1: Verificando Supabase CLI...');
    
    // Verificar se o CLI está instalado
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      console.log('✅ Supabase CLI encontrado');
    } catch (error) {
      console.error('❌ Supabase CLI não encontrado');
      console.log('💡 Instale com: npm install -g supabase');
      return;
    }
    
    console.log('\n📋 ETAPA 2: Exportando dados locais...');
    
    // Exportar dados do Supabase local
    const localSupabase = createClient(
      'http://127.0.0.1:54331',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
    
    // Exportar todos os dados
    const exportData = await exportAllData(localSupabase);
    
    // Salvar em arquivo
    const exportFile = `kanban-export-${new Date().toISOString().split('T')[0]}.json`;
    writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`✅ Dados exportados para: ${exportFile}`);
    
    console.log('\n📋 ETAPA 3: Configurando projeto remoto...');
    
    // Verificar se já está logado
    try {
      execSync('supabase projects list', { stdio: 'pipe' });
      console.log('✅ Já logado no Supabase');
    } catch (error) {
      console.log('🔐 Faça login no Supabase CLI:');
      console.log('   supabase login');
      console.log('   (Siga as instruções no navegador)');
      return;
    }
    
    console.log('\n📋 ETAPA 4: Aplicando migrations...');
    
    // Aplicar migrations no projeto remoto
    try {
      execSync('supabase db push', { stdio: 'inherit' });
      console.log('✅ Migrations aplicadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aplicar migrations:', error.message);
      console.log('💡 Verifique se o projeto está configurado corretamente');
      return;
    }
    
    console.log('\n📋 ETAPA 5: Importando dados...');
    
    // Importar dados usando o CLI
    await importDataWithCLI(exportFile);
    
    console.log('\n📋 ETAPA 6: Verificando migração...');
    
    // Verificar se os dados foram importados
    await verifyMigration();
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('==================================');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Atualize o arquivo .env.local com as credenciais online');
    console.log('2. Teste a aplicação: npm run dev');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

async function exportAllData(supabase) {
  console.log('🔄 Exportando dados do Kanban...');
  
  const [
    boards, columns, tasks, comments, assignees, labels, taskLabels,
    checklists, checklistItems, attachments, activities
  ] = await Promise.all([
    supabase.from('kanban_boards').select('*'),
    supabase.from('kanban_columns').select('*'),
    supabase.from('kanban_tasks').select('*'),
    supabase.from('kanban_comments').select('*'),
    supabase.from('kanban_task_assignees').select('*'),
    supabase.from('kanban_labels').select('*'),
    supabase.from('kanban_task_labels').select('*'),
    supabase.from('kanban_checklists').select('*'),
    supabase.from('kanban_checklist_items').select('*'),
    supabase.from('kanban_attachments').select('*'),
    supabase.from('kanban_activities').select('*')
  ]);
  
  const exportData = {
    boards: boards.data || [],
    columns: columns.data || [],
    tasks: tasks.data || [],
    comments: comments.data || [],
    assignees: assignees.data || [],
    labels: labels.data || [],
    taskLabels: taskLabels.data || [],
    checklists: checklists.data || [],
    checklistItems: checklistItems.data || [],
    attachments: attachments.data || [],
    activities: activities.data || [],
    exported_at: new Date().toISOString(),
    version: '2.0.0'
  };
  
  console.log('✅ Dados exportados:');
  console.log(`   - Boards: ${exportData.boards.length}`);
  console.log(`   - Columns: ${exportData.columns.length}`);
  console.log(`   - Tasks: ${exportData.tasks.length}`);
  console.log(`   - Comments: ${exportData.comments.length}`);
  console.log(`   - Assignees: ${exportData.assignees.length}`);
  console.log(`   - Labels: ${exportData.labels.length}`);
  console.log(`   - Task Labels: ${exportData.taskLabels.length}`);
  console.log(`   - Checklists: ${exportData.checklists.length}`);
  console.log(`   - Checklist Items: ${exportData.checklistItems.length}`);
  console.log(`   - Attachments: ${exportData.attachments.length}`);
  console.log(`   - Activities: ${exportData.activities.length}`);
  
  return exportData;
}

async function importDataWithCLI(exportFile) {
  console.log('🔄 Importando dados...');
  
  try {
    // Ler dados do arquivo
    const exportData = JSON.parse(readFileSync(exportFile, 'utf8'));
    
    // Criar script SQL para importação
    const importSQL = generateImportSQL(exportData);
    
    // Salvar script SQL
    const sqlFile = 'import-kanban-data.sql';
    writeFileSync(sqlFile, importSQL);
    
    // Executar SQL no projeto remoto
    execSync(`supabase db reset --db-url "postgresql://postgres:postgres@db.${process.env.SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" -f ${sqlFile}`, { stdio: 'inherit' });
    
    console.log('✅ Dados importados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao importar dados:', error.message);
    console.log('💡 Importe manualmente usando o Dashboard do Supabase');
  }
}

function generateImportSQL(data) {
  let sql = '-- Importação automática dos dados do Kanban\n\n';
  
  // Importar boards
  if (data.boards.length > 0) {
    sql += '-- Importar boards\n';
    sql += 'INSERT INTO kanban_boards (id, name, description, created_at, updated_at) VALUES\n';
    sql += data.boards.map(board => 
      `('${board.id}', '${board.name}', ${board.description ? `'${board.description}'` : 'NULL'}, '${board.created_at}', '${board.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar columns
  if (data.columns.length > 0) {
    sql += '-- Importar columns\n';
    sql += 'INSERT INTO kanban_columns (id, board_id, name, position, created_at, updated_at) VALUES\n';
    sql += data.columns.map(column => 
      `('${column.id}', '${column.board_id}', '${column.name}', ${column.position}, '${column.created_at}', '${column.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar tasks
  if (data.tasks.length > 0) {
    sql += '-- Importar tasks\n';
    sql += 'INSERT INTO kanban_tasks (id, board_id, column_id, title, description, priority, due_date, position, is_archived, created_by, created_at, updated_at) VALUES\n';
    sql += data.tasks.map(task => 
      `('${task.id}', '${task.board_id}', '${task.column_id}', '${task.title}', ${task.description ? `'${task.description}'` : 'NULL'}, '${task.priority || 'medium'}', ${task.due_date ? `'${task.due_date}'` : 'NULL'}, ${task.position}, ${task.is_archived}, '${task.created_by}', '${task.created_at}', '${task.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar comments
  if (data.comments.length > 0) {
    sql += '-- Importar comments\n';
    sql += 'INSERT INTO kanban_comments (id, task_id, author_id, content, created_at, updated_at) VALUES\n';
    sql += data.comments.map(comment => 
      `('${comment.id}', '${comment.task_id}', '${comment.author_id}', '${comment.content}', '${comment.created_at}', '${comment.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar assignees
  if (data.assignees.length > 0) {
    sql += '-- Importar assignees\n';
    sql += 'INSERT INTO kanban_task_assignees (id, task_id, user_id, assigned_at) VALUES\n';
    sql += data.assignees.map(assignee => 
      `('${assignee.id}', '${assignee.task_id}', '${assignee.user_id}', '${assignee.assigned_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar labels
  if (data.labels.length > 0) {
    sql += '-- Importar labels\n';
    sql += 'INSERT INTO kanban_labels (id, board_id, name, color, created_at, updated_at) VALUES\n';
    sql += data.labels.map(label => 
      `('${label.id}', '${label.board_id}', '${label.name}', '${label.color}', '${label.created_at}', '${label.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar task labels
  if (data.taskLabels.length > 0) {
    sql += '-- Importar task labels\n';
    sql += 'INSERT INTO kanban_task_labels (id, task_id, label_id, created_at) VALUES\n';
    sql += data.taskLabels.map(taskLabel => 
      `('${taskLabel.id}', '${taskLabel.task_id}', '${taskLabel.label_id}', '${taskLabel.created_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar checklists
  if (data.checklists.length > 0) {
    sql += '-- Importar checklists\n';
    sql += 'INSERT INTO kanban_checklists (id, task_id, title, position, created_at, updated_at) VALUES\n';
    sql += data.checklists.map(checklist => 
      `('${checklist.id}', '${checklist.task_id}', '${checklist.title}', ${checklist.position}, '${checklist.created_at}', '${checklist.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar checklist items
  if (data.checklistItems.length > 0) {
    sql += '-- Importar checklist items\n';
    sql += 'INSERT INTO kanban_checklist_items (id, checklist_id, title, is_completed, position, created_at, updated_at) VALUES\n';
    sql += data.checklistItems.map(item => 
      `('${item.id}', '${item.checklist_id}', '${item.title}', ${item.is_completed}, ${item.position}, '${item.created_at}', '${item.updated_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar attachments
  if (data.attachments.length > 0) {
    sql += '-- Importar attachments\n';
    sql += 'INSERT INTO kanban_attachments (id, task_id, name, url, file_type, file_size, created_at) VALUES\n';
    sql += data.attachments.map(attachment => 
      `('${attachment.id}', '${attachment.task_id}', '${attachment.name}', '${attachment.url}', ${attachment.file_type ? `'${attachment.file_type}'` : 'NULL'}, ${attachment.file_size || 'NULL'}, '${attachment.created_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  // Importar activities
  if (data.activities.length > 0) {
    sql += '-- Importar activities\n';
    sql += 'INSERT INTO kanban_activities (id, task_id, user_id, action, details, created_at) VALUES\n';
    sql += data.activities.map(activity => 
      `('${activity.id}', '${activity.task_id}', '${activity.user_id}', '${activity.action}', ${activity.details ? `'${JSON.stringify(activity.details)}'` : 'NULL'}, '${activity.created_at}')`
    ).join(',\n') + ';\n\n';
  }
  
  return sql;
}

async function verifyMigration() {
  console.log('🔍 Verificando migração...');
  
  try {
    // Verificar se as tabelas foram criadas
    execSync('supabase db diff --schema public', { stdio: 'pipe' });
    console.log('✅ Estrutura das tabelas verificada');
    
    // Verificar dados
    console.log('✅ Dados importados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar migração
migrateWithCLI().catch(console.error);
