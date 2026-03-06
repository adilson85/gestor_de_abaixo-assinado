import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rncowiwstzumxruaojvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDuplicateCheck() {
  console.log('🔍 Testando verificação de duplicatas como visitante não autenticado...\n');

  // Pegar uma petition real
  const { data: petitions } = await supabase
    .from('petitions')
    .select('id')
    .eq('available_online', true)
    .limit(1);

  if (!petitions || petitions.length === 0) {
    console.log('❌ Nenhuma petition online encontrada');
    return;
  }

  const petitionId = petitions[0].id;
  console.log('Petition ID:', petitionId);

  // Tentar buscar signatures com filtro (igual checkPhoneDuplicate)
  console.log('\n📞 Testando busca de telefone duplicado...');
  const { data, error } = await supabase
    .from('signatures')
    .select('id')
    .eq('petition_id', petitionId)
    .eq('phone', '47988519998'); // Telefone de teste

  if (error) {
    console.log('❌ ERRO ao verificar duplicata:', error.message);
    console.log('Código:', error.code);
    console.log('\n⚠️  PROBLEMA: Visitantes não conseguem verificar duplicatas!');
    console.log('\nSOLUÇÃO: Precisamos adicionar política RLS que permita');
    console.log('visitantes públicos fazerem SELECT em signatures com filtros.');
  } else {
    console.log('✅ Verificação funcionando!');
    console.log('Resultados encontrados:', data.length);
    if (data.length > 0) {
      console.log('ID da signature encontrada:', data[0].id);
    }
  }
}

testDuplicateCheck().catch(console.error);
