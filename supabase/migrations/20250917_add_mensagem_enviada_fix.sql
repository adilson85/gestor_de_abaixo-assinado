/*
  Atualiza estrutura das tabelas de assinaturas para suportar "mensagem_enviada"

  1) Adiciona a coluna mensagem_enviada em TODAS as tabelas existentes que
     começam com "signatures_".
  2) Atualiza a função RPC create_signatures_table para que novas tabelas já
     nasçam com a coluna mensagem_enviada BOOLEAN DEFAULT false.
*/

-- 1) Garantir a coluna nas tabelas já criadas
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'signatures_%'
  ) LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS mensagem_enviada BOOLEAN DEFAULT false;', t);
  END LOOP;
END $$;

-- 2) Atualizar a função que cria novas tabelas de assinaturas
CREATE OR REPLACE FUNCTION create_signatures_table(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cria a tabela (se não existir) com a coluna mensagem_enviada
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

  -- Permissões
  EXECUTE format('GRANT ALL ON TABLE %I TO authenticated;', table_name);
  EXECUTE format('GRANT ALL ON TABLE %I TO service_role;', table_name);

  -- RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name);

  -- Políticas
  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Users can view signatures" ON %I
    FOR SELECT TO authenticated
    USING (true);
  ', table_name);

  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Users can insert signatures" ON %I
    FOR INSERT TO authenticated
    WITH CHECK (true);
  ', table_name);

  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Users can update signatures" ON %I
    FOR UPDATE TO authenticated
    USING (true);
  ', table_name);

  EXECUTE format('
    CREATE POLICY IF NOT EXISTS "Users can delete signatures" ON %I
    FOR DELETE TO authenticated
    USING (true);
  ', table_name);
END;
$$;


