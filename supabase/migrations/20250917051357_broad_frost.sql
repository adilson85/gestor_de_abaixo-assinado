/*
  # Create RPC function for dynamic signature tables

  1. New Functions
    - `create_signatures_table(table_name TEXT)` - Creates a new signature table with proper structure and permissions
  
  2. Security
    - Enable RLS on created tables
    - Add policies for read access and authenticated insert
    - Grant proper permissions to authenticated and service_role
  
  3. Table Structure
    - Standard signature fields (name, phone, address fields)
    - UUID primary key with auto-generation
    - Timestamps for audit trail
*/

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
        CREATE POLICY "Enable read access for all users" ON %I 
        FOR SELECT USING (true);
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY "Enable insert for authenticated users" ON %I 
        FOR INSERT WITH CHECK (auth.role() = ''authenticated'');
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY "Enable update for authenticated users" ON %I 
        FOR UPDATE USING (auth.role() = ''authenticated'');
    ', table_name);
    
    EXECUTE format('
        CREATE POLICY "Enable delete for authenticated users" ON %I 
        FOR DELETE USING (auth.role() = ''authenticated'');
    ', table_name);
END;
$$;