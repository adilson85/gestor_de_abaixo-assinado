-- Verificar se a tabela signatures existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'signatures';

-- Se não existir, criar a tabela
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

-- Grant permissions
GRANT ALL ON TABLE signatures TO authenticated;
GRANT ALL ON TABLE signatures TO service_role;

-- Enable RLS
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON signatures 
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON signatures 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON signatures 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users" ON signatures 
FOR DELETE USING (auth.role() = 'authenticated');
