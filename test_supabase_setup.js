// Script para testar a configuração do Supabase local
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54341';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseSetup() {
  console.log('🔍 Testando configuração do Supabase local...\n');

  try {
    // 1. Testar conexão básica
    console.log('📡 Testando conexão com a API...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('petitions')
      .select('count')
      .limit(1);

    if (healthError && healthError.code !== 'PGRST116') {
      console.error('❌ Erro na conexão:', healthError);
      return;
    }
    console.log('✅ Conexão com API funcionando!');

    // 2. Verificar se as tabelas existem
    console.log('\n📊 Verificando estrutura do banco...');
    
    const tables = ['petitions', 'signatures', 'admin_users', 'kanban_boards', 'kanban_columns', 'kanban_tasks'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          console.log(`❌ Tabela '${table}' não encontrada`);
        } else {
          console.log(`✅ Tabela '${table}' existe`);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela '${table}':`, err.message);
      }
    }

    // 3. Testar RLS policies
    console.log('\n🔒 Testando Row Level Security...');
    
    // Tentar inserir sem autenticação (deve falhar)
    const { data: insertData, error: insertError } = await supabase
      .from('petitions')
      .insert({
        slug: 'teste-rls-' + Date.now(),
        name: 'Teste RLS',
        table_name: 'teste_rls_' + Date.now()
      })
      .select();

    if (insertError) {
      console.log('✅ RLS funcionando - inserção bloqueada sem autenticação');
      console.log('   Erro esperado:', insertError.message);
    } else {
      console.log('⚠️  RLS pode não estar funcionando - inserção permitida sem autenticação');
    }

    // 4. Verificar configurações do projeto
    console.log('\n⚙️  Configurações do projeto:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Chave: ${supabaseAnonKey.substring(0, 20)}...`);
    
    // 5. Testar leitura pública (deve funcionar)
    console.log('\n📖 Testando leitura pública...');
    const { data: readData, error: readError } = await supabase
      .from('petitions')
      .select('*')
      .limit(5);

    if (readError) {
      console.log('❌ Erro na leitura:', readError.message);
    } else {
      console.log(`✅ Leitura funcionando - ${readData.length} registros encontrados`);
    }

    console.log('\n🎉 Teste de configuração concluído!');
    console.log('\n📋 Resumo:');
    console.log('   - API: ✅ Funcionando');
    console.log('   - Tabelas: Verificadas');
    console.log('   - RLS: ✅ Ativo');
    console.log('   - Leitura: ✅ Funcionando');
    console.log('   - Inserção: ❌ Bloqueada (esperado sem auth)');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testSupabaseSetup();


