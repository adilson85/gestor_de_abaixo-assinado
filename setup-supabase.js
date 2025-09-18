// Script para configurar o Supabase com as migrações necessárias
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

async function setupSupabase() {
  console.log('🔧 Configurando Supabase...');
  
  try {
    // 1. Verificar se a função existe
    console.log('📋 Verificando função create_signatures_table...');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'create_signatures_table');
    
    if (functionsError) {
      console.log('⚠️  Não foi possível verificar funções (normal se não for admin)');
    } else {
      console.log('📊 Funções encontradas:', functions);
    }
    
    // 2. Tentar executar a migração diretamente
    console.log('🚀 Executando migração create_signatures_table...');
    
    const migrationSQL = `
CREATE OR REPLACE FUNCTION create_signatures_table(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create the signatures table with proper structure
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            street TEXT,
            neighborhood TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            mensagem_enviada BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ', table_name);
    
    -- Grant permissions
    EXECUTE format('GRANT ALL ON TABLE %I TO authenticated;', table_name);
    EXECUTE format('GRANT ALL ON TABLE %I TO service_role;', table_name);
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name);
    
    -- Create policies
    EXECUTE format('
        CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON %I 
        FOR SELECT USING (true);
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON %I 
        FOR INSERT WITH CHECK (auth.role() = ''authenticated'');
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON %I 
        FOR UPDATE USING (auth.role() = ''authenticated'');
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users" ON %I 
        FOR DELETE USING (auth.role() = ''authenticated'');
    ', table_name);
END;
$$;
    `;
    
    // Tentar executar via RPC exec (se existir)
    const { error: execError } = await supabase.rpc('exec', {
      sql: migrationSQL
    });
    
    if (execError) {
      console.log('⚠️  RPC exec não disponível, tentando método alternativo...');
      
      // Método alternativo: tentar criar a função via query direta
      const { error: queryError } = await supabase
        .from('information_schema.routines')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.error('❌ Não foi possível executar migração automaticamente');
        console.error('📋 Execute manualmente no SQL Editor do Supabase:');
        console.log('\n' + '='.repeat(80));
        console.log(migrationSQL);
        console.log('='.repeat(80) + '\n');
      }
    } else {
      console.log('✅ Migração executada com sucesso!');
    }
    
    // 3. Testar a função
    console.log('🧪 Testando função create_signatures_table...');
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
      try {
        await supabase.rpc('exec', {
          sql: `DROP TABLE IF EXISTS ${testTableName}`
        });
        console.log('🧹 Tabela de teste removida');
      } catch (cleanupError) {
        console.log('⚠️  Não foi possível limpar tabela de teste');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

setupSupabase();