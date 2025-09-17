import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env.local
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSaveSignature() {
  console.log('🔍 Testando salvamento de assinatura...\n');

  try {
    // Buscar uma petição existente
    const { data: petitions, error: petitionsError } = await supabase
      .from('petitions')
      .select('id, name, table_name')
      .limit(1);

    if (petitionsError) {
      console.log('❌ Erro ao buscar petições:', petitionsError.message);
      return false;
    }

    if (petitions.length === 0) {
      console.log('⚠️  Nenhuma petição encontrada para testar');
      return false;
    }

    const petition = petitions[0];
    console.log('✅ Petição encontrada:', petition.name);
    console.log('📋 Tabela de assinaturas:', petition.table_name);

    // Testar inserção de assinatura
    const testSignature = {
      name: 'Teste de Assinatura',
      phone: '11999999999',
      street: 'Rua Teste',
      neighborhood: 'Bairro Teste',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234567',
      mensagem_enviada: false
    };

    console.log('🔄 Testando inserção de assinatura...');
    console.log('📝 Dados:', testSignature);

    const { data, error } = await supabase
      .from(petition.table_name)
      .insert(testSignature)
      .select()
      .single();

    if (error) {
      console.log('❌ Erro ao salvar assinatura:', error.message);
      console.log('💡 Detalhes do erro:', error);
      
      if (error.message.includes('mensagem_enviada')) {
        console.log('🔧 Solução: Execute a migração para adicionar a coluna mensagem_enviada');
        console.log('📋 Arquivo: supabase/migrations/20250120000002_add_message_sent_column.sql');
      }
      
      return false;
    }

    console.log('✅ Assinatura salva com sucesso!');
    console.log('📝 ID da assinatura:', data.id);

    // Limpar a assinatura de teste
    await supabase
      .from(petition.table_name)
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Assinatura de teste removida');

    return true;

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    return false;
  }
}

testSaveSignature().then(success => {
  if (success) {
    console.log('\n✅ Sistema de salvamento funcionando!');
  } else {
    console.log('\n❌ Problema identificado no salvamento');
    console.log('🔧 Execute a migração no painel do Supabase');
  }
});
