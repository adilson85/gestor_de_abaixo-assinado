// Teste para verificar se a função exec existe
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente
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
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExecFunction() {
  console.log('🔍 Testando função exec...');
  
  try {
    // Teste 1: SQL simples
    console.log('📋 Teste 1: SQL simples');
    const { data: data1, error: error1 } = await supabase.rpc('exec', {
      sql: 'SELECT 1 as test;'
    });
    
    if (error1) {
      console.error('❌ Erro no teste 1:', error1);
    } else {
      console.log('✅ Teste 1 funcionou!', data1);
    }
    
    // Teste 2: Verificar se a função exec existe
    console.log('📋 Teste 2: Verificar função exec');
    const { data: data2, error: error2 } = await supabase.rpc('exec', {
      sql: 'SELECT proname FROM pg_proc WHERE proname = \'exec\';'
    });
    
    if (error2) {
      console.error('❌ Erro no teste 2:', error2);
    } else {
      console.log('✅ Teste 2 funcionou!', data2);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testExecFunction();
