import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rncowiwstzumxruaojvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeKanbanBoard() {
  console.log('🚀 Inicializando Board Kanban Global...\n');

  // Step 1: Create Global Board
  console.log('📋 Passo 1: Criando board global...');
  const { data: board, error: boardError } = await supabase
    .from('kanban_boards')
    .insert({
      name: 'Tarefas Globais',
      is_global: true
    })
    .select()
    .single();

  if (boardError) {
    console.log('❌ Erro ao criar board:', boardError.message);
    return;
  }

  console.log('✅ Board criado:', board.name, '(ID:', board.id, ')\n');

  // Step 2: Create Default Columns
  console.log('📝 Passo 2: Criando colunas padrão...');

  const columns = [
    { name: 'Coleta de assinaturas', position: 0 },
    { name: 'Gravação de vídeo', position: 1 },
    { name: 'Disparo de mensagem', position: 2 },
    { name: 'Apresentar ao poder público', position: 3 },
    { name: 'Aguardar retorno', position: 4 },
    { name: 'Dar retorno à população', position: 5 },
    { name: 'Atividades extras', position: 6 }
  ];

  for (const column of columns) {
    const { data: col, error: colError } = await supabase
      .from('kanban_columns')
      .insert({
        board_id: board.id,
        name: column.name,
        position: column.position,
        is_active: true
      })
      .select()
      .single();

    if (colError) {
      console.log(`❌ Erro ao criar coluna "${column.name}":`, colError.message);
    } else {
      console.log(`✅ Coluna criada: ${col.name} (posição ${col.position})`);
    }
  }

  console.log('\n🎉 Inicialização concluída com sucesso!');
  console.log('\n📌 Agora você pode acessar a página de Tasks no seu aplicativo.');
}

initializeKanbanBoard().catch(console.error);
