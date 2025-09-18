-- MIGRAÇÃO COMPLETA PARA SUPABASE
-- Execute este SQL no SQL Editor do Supabase

-- 1. Função para criar tabelas de assinaturas
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

-- 2. Verificar se a função foi criada
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'create_signatures_table';
