/*
  # Create petitions management tables

  1. New Tables
    - `petitions`
      - `id` (uuid, primary key)
      - `slug` (text, unique)
      - `name` (text)
      - `description` (text, optional)
      - `location` (text, optional)
      - `collection_date` (date, optional)
      - `responsible` (text, optional)
      - `table_name` (text, unique) - nome da tabela específica para assinaturas
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `petitions` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS petitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  location text,
  collection_date date,
  responsible text,
  table_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read petitions"
  ON petitions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert petitions"
  ON petitions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update petitions"
  ON petitions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete petitions"
  ON petitions
  FOR DELETE
  TO authenticated
  USING (true);

-- Função para criar tabela de assinaturas dinamicamente
CREATE OR REPLACE FUNCTION create_signatures_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      phone text NOT NULL,
      street text,
      neighborhood text,
      city text,
      state text,
      zip_code text,
      created_at timestamptz DEFAULT now()
    )', table_name);
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Add policies
  EXECUTE format('
    CREATE POLICY "Users can read signatures" ON %I
    FOR SELECT TO authenticated USING (true)
  ', table_name);
  
  EXECUTE format('
    CREATE POLICY "Users can insert signatures" ON %I
    FOR INSERT TO authenticated WITH CHECK (true)
  ', table_name);
  
  EXECUTE format('
    CREATE POLICY "Users can update signatures" ON %I
    FOR UPDATE TO authenticated USING (true)
  ', table_name);
  
  EXECUTE format('
    CREATE POLICY "Users can delete signatures" ON %I
    FOR DELETE TO authenticated USING (true)
  ', table_name);
END;
$$;