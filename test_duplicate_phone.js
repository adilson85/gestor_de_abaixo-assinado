// Script para testar se o banco permite telefones duplicados
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54341';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDuplicatePhone() {
  console.log('🔍 Testando se o banco permite telefones duplicados...\n');

  try {
    // 1. Buscar uma petition existente
    const { data: petitions, error: petitionsError } = await supabase
      .from('petitions')
      .select('id, name')
      .limit(1);

    if (petitionsError || !petitions || petitions.length === 0) {
      console.log('❌ Nenhuma petition encontrada. Criando uma de teste...');
      
      // Criar uma petition de teste
      const { data: newPetition, error: createError } = await supabase
        .from('petitions')
        .insert({
          slug: 'teste-duplicata-' + Date.now(),
          name: 'Teste de Duplicata',
          table_name: 'teste_duplicata_' + Date.now(),
          available_online: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar petition de teste:', createError);
        return;
      }
      
      console.log('✅ Petition de teste criada:', newPetition.name);
      var petitionId = newPetition.id;
    } else {
      petitionId = petitions[0].id;
      console.log('✅ Usando petition existente:', petitions[0].name);
    }

    // 2. Tentar inserir a primeira assinatura
    const testPhone = '11999999999';
    const testName = 'João Silva Teste';

    console.log(`\n📝 Tentando inserir primeira assinatura...`);
    console.log(`   Telefone: ${testPhone}`);
    console.log(`   Nome: ${testName}`);

    const { data: firstSignature, error: firstError } = await supabase
      .from('signatures')
      .insert({
        petition_id: petitionId,
        name: testName,
        phone: testPhone
      })
      .select()
      .single();

    if (firstError) {
      console.error('❌ Erro ao inserir primeira assinatura:', firstError);
      return;
    }

    console.log('✅ Primeira assinatura inserida com sucesso!');
    console.log(`   ID: ${firstSignature.id}`);

    // 3. Tentar inserir a segunda assinatura com o mesmo telefone
    console.log(`\n📝 Tentando inserir segunda assinatura com o MESMO telefone...`);
    console.log(`   Telefone: ${testPhone}`);
    console.log(`   Nome: Maria Santos Teste`);

    const { data: secondSignature, error: secondError } = await supabase
      .from('signatures')
      .insert({
        petition_id: petitionId,
        name: 'Maria Santos Teste',
        phone: testPhone
      })
      .select()
      .single();

    if (secondError) {
      console.log('✅ BANCO BLOQUEANDO DUPLICATAS!');
      console.log('   Erro:', secondError.message);
      console.log('   Código:', secondError.code);
    } else {
      console.log('❌ PROBLEMA: BANCO PERMITINDO DUPLICATAS!');
      console.log('   Segunda assinatura inserida:', secondSignature.id);
      console.log('   ⚠️  Isso não deveria acontecer!');
    }

    // 4. Verificar quantas assinaturas existem com esse telefone
    console.log(`\n🔍 Verificando quantas assinaturas existem com o telefone ${testPhone}...`);
    
    const { data: signatures, error: countError } = await supabase
      .from('signatures')
      .select('id, name, phone, created_at')
      .eq('petition_id', petitionId)
      .eq('phone', testPhone);

    if (countError) {
      console.error('❌ Erro ao contar assinaturas:', countError);
    } else {
      console.log(`📊 Total de assinaturas com o telefone ${testPhone}: ${signatures.length}`);
      signatures.forEach((sig, index) => {
        console.log(`   ${index + 1}. ${sig.name} - ${sig.phone} (${sig.created_at})`);
      });
    }

    // 5. Limpeza - remover assinaturas de teste
    console.log(`\n🧹 Limpando dados de teste...`);
    
    const { error: deleteError } = await supabase
      .from('signatures')
      .delete()
      .eq('petition_id', petitionId)
      .eq('phone', testPhone);

    if (deleteError) {
      console.error('❌ Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('✅ Dados de teste removidos com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testDuplicatePhone();
