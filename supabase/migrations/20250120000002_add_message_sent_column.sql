-- Add mensagem_enviada column to signatures tables
-- This will be applied to all existing signature tables

-- Create a function to add the column to all signature tables
CREATE OR REPLACE FUNCTION add_message_sent_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name text;
    table_names text[];
BEGIN
    -- Get all tables that start with 'signatures_'
    SELECT array_agg(tablename) INTO table_names
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'signatures_%';
    
    -- Add the column to each table
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS mensagem_enviada boolean DEFAULT false', table_name);
    END LOOP;
END;
$$;

-- Execute the function
SELECT add_message_sent_column();

-- Update the create_signatures_table function to include the new column
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
        CREATE POLICY "Users can view signatures" ON %I
        FOR SELECT TO authenticated
        USING (true);
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY "Users can insert signatures" ON %I
        FOR INSERT TO authenticated
        WITH CHECK (true);
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY "Users can update signatures" ON %I
        FOR UPDATE TO authenticated
        USING (true);
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY "Users can delete signatures" ON %I
        FOR DELETE TO authenticated
        USING (true);
    ', table_name);
END;
$$;
