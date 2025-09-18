-- MIGRAÇÃO CORRIGIDA PARA TABELA ÚNICA DE ASSINATURAS
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela única de assinaturas
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
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

-- 2. Grant permissions
GRANT ALL ON TABLE signatures TO authenticated;
GRANT ALL ON TABLE signatures TO service_role;

-- 3. Enable RLS
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies existentes (se houver) e criar novas
DROP POLICY IF EXISTS "Enable read access for all users" ON signatures;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON signatures;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON signatures;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON signatures;

-- 5. Criar policies
CREATE POLICY "Enable read access for all users" ON signatures 
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON signatures 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON signatures 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON signatures 
FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_signatures_petition_id ON signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_signatures_phone ON signatures(phone);
CREATE INDEX IF NOT EXISTS idx_signatures_created_at ON signatures(created_at);

-- 7. Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'signatures' 
ORDER BY ordinal_position;
