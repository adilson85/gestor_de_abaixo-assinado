import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rncowiwstzumxruaojvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  // Test 1: Petitions
  console.log('📝 Teste 1: Buscando petitions...');
  try {
    const { data: petitions, error: petitionsError } = await supabase
      .from('petitions')
      .select('id, name, created_at')
      .limit(5);

    if (petitionsError) {
      console.log('❌ Erro ao buscar petitions:', petitionsError.message);
      console.log('   Detalhes:', JSON.stringify(petitionsError, null, 2));
    } else {
      console.log('✅ Petitions encontradas:', petitions.length);
      if (petitions.length > 0) {
        console.log('   Exemplo:', petitions[0]);
      } else {
        console.log('   ⚠️  Nenhuma petition encontrada no banco');
      }
    }
  } catch (error) {
    console.log('❌ Exceção ao buscar petitions:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Kanban Boards
  console.log('📋 Teste 2: Buscando kanban_boards...');
  try {
    const { data: boards, error: boardsError } = await supabase
      .from('kanban_boards')
      .select('id, name, created_at')
      .limit(5);

    if (boardsError) {
      console.log('❌ Erro ao buscar kanban_boards:', boardsError.message);
      console.log('   Detalhes:', JSON.stringify(boardsError, null, 2));
    } else {
      console.log('✅ Kanban boards encontrados:', boards.length);
      if (boards.length > 0) {
        console.log('   Exemplo:', boards[0]);
      } else {
        console.log('   ⚠️  Nenhum board encontrado no banco');
      }
    }
  } catch (error) {
    console.log('❌ Exceção ao buscar kanban_boards:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Check RLS
  console.log('🔒 Teste 3: Verificando políticas RLS...');
  try {
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('has_permission', { permission: 'select', table_name: 'petitions' })
      .single();

    if (rlsError) {
      console.log('⚠️  Não foi possível verificar RLS diretamente');
      console.log('   (Isso é normal se a função não existir)');
    } else {
      console.log('✅ RLS Info:', rlsInfo);
    }
  } catch (error) {
    console.log('⚠️  RLS check não disponível:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Auth Status
  console.log('🔐 Teste 4: Status de autenticação...');
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log('✅ Usuário autenticado:', session.user.email);
    console.log('   User ID:', session.user.id);
  } else {
    console.log('⚠️  Nenhum usuário autenticado');
    console.log('   (Isso é esperado se você não fez login via CLI)');
  }

  console.log('\n---\n');
  console.log('🏁 Testes concluídos!\n');
}

testConnection().catch(console.error);
