// Script para testar se as funções RPC existem no Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env.local
let supabaseUrl, supabaseAnonKey;
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1];
    }
  }
} catch (err) {
  console.error('❌ Erro ao ler .env.local:', err.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseFunctions() {
  console.log('🔍 Testando funções RPC do Supabase...');
  
  try {
    // Testar se a função create_signatures_table existe
    console.log('📋 Testando create_signatures_table...');
    const testTableName = `test_table_${Date.now()}`;
    
    const { data, error } = await supabase.rpc('create_signatures_table', {
      table_name: testTableName
    });
    
    if (error) {
      console.error('❌ Erro na função create_signatures_table:', error);
      console.error('Detalhes:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Função create_signatures_table funcionando!');
      console.log('📊 Resultado:', data);
      
      // Limpar tabela de teste
      await supabase.rpc('exec', {
        sql: `DROP TABLE IF EXISTS ${testTableName}`
      });
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testSupabaseFunctions();
