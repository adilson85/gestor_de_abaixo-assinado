// Teste específico para a função create_signatures_table
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

async function testSpecificFunction() {
  console.log('🔍 Testando função create_signatures_table com diferentes abordagens...');
  
  try {
    // Teste 1: Nome simples
    console.log('📋 Teste 1: Nome simples');
    const testTableName1 = `test_simple_${Date.now()}`;
    
    const { data: data1, error: error1 } = await supabase.rpc('create_signatures_table', {
      table_name: testTableName1
    });
    
    if (error1) {
      console.error('❌ Erro no teste 1:', error1);
    } else {
      console.log('✅ Teste 1 funcionou!');
    }
    
    // Teste 2: Nome com underscore
    console.log('📋 Teste 2: Nome com underscore');
    const testTableName2 = `test_underscore_${Date.now()}`;
    
    const { data: data2, error: error2 } = await supabase.rpc('create_signatures_table', {
      table_name: testTableName2
    });
    
    if (error2) {
      console.error('❌ Erro no teste 2:', error2);
    } else {
      console.log('✅ Teste 2 funcionou!');
    }
    
    // Teste 3: Verificar se as tabelas foram criadas
    console.log('📋 Verificando se as tabelas foram criadas...');
    
    // Tentar listar tabelas (pode não funcionar sem permissões)
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .like('table_name', 'test_%');
    
    if (tablesError) {
      console.log('⚠️  Não foi possível listar tabelas (normal sem permissões admin)');
    } else {
      console.log('📊 Tabelas encontradas:', tables);
    }
    
    // Teste 4: Tentar inserir dados na tabela (se foi criada)
    console.log('📋 Teste 4: Tentando inserir dados...');
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from(testTableName1)
        .insert({
          name: 'Teste',
          phone: '11999999999'
        })
        .select();
      
      if (insertError) {
        console.log('⚠️  Erro ao inserir (tabela pode não ter sido criada):', insertError.message);
      } else {
        console.log('✅ Inserção funcionou!', insertData);
      }
    } catch (insertErr) {
      console.log('⚠️  Erro na inserção:', insertErr.message);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testSpecificFunction();
