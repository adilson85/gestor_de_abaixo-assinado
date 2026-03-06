import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rncowiwstzumxruaojvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthenticatedAccess() {
  console.log('🔐 Testando acesso como ANON KEY (não autenticado)...\n');

  // Teste 1: Petitions
  console.log('📝 Teste 1: Buscando petitions...');
  const { data: petitions, error: petitionsError } = await supabase
    .from('petitions')
    .select('*');

  if (petitionsError) {
    console.log('❌ Erro:', petitionsError.message);
  } else {
    console.log(`✅ Petitions encontradas: ${petitions.length}`);
    if (petitions.length > 0) {
      console.log('   Primeira petition:', petitions[0].name);
    }
  }

  console.log('\n---\n');

  // Teste 2: Signatures
  console.log('📝 Teste 2: Buscando signatures...');
  const { data: signatures, error: signaturesError } = await supabase
    .from('signatures')
    .select('*');

  if (signaturesError) {
    console.log('❌ Erro:', signaturesError.message);
  } else {
    console.log(`✅ Signatures encontradas: ${signatures.length}`);
  }

  console.log('\n---\n');

  // Teste 3: Kanban Boards
  console.log('📝 Teste 3: Buscando kanban_boards...');
  const { data: boards, error: boardsError } = await supabase
    .from('kanban_boards')
    .select('*');

  if (boardsError) {
    console.log('❌ Erro:', boardsError.message);
  } else {
    console.log(`✅ Boards encontrados: ${boards.length}`);
  }

  console.log('\n---\n');

  // Teste 4: Status de autenticação
  console.log('🔐 Teste 4: Verificando status de autenticação...');
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log('✅ Sessão ativa:');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Role:', session.user.role);
  } else {
    console.log('⚠️  Nenhuma sessão ativa (esperado para anon key)');
  }

  console.log('\n===================================\n');
  console.log('💡 CONCLUSÃO:');
  console.log('\nSe você vê PETITIONS mas com ERRO, significa que:');
  console.log('1. As políticas RLS ainda exigem autenticação');
  console.log('2. O anon key não tem permissão de leitura');
  console.log('3. Precisamos verificar as políticas no Dashboard');
  console.log('\nSe você vê petitions COM SUCESSO, significa que:');
  console.log('1. As políticas públicas estão funcionando');
  console.log('2. O problema pode ser na sessão autenticada do app');
}

testAuthenticatedAccess().catch(console.error);
