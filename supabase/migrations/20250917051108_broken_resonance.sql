/*
  # Sistema de Autenticação

  1. Configurações de Autenticação
    - Habilita autenticação por email/senha
    - Desabilita confirmação de email para facilitar desenvolvimento
    
  2. Tabela de Administradores
    - `admin_users` - controla quais usuários são administradores
    - RLS habilitado para segurança
    
  3. Políticas de Segurança
    - Apenas usuários autenticados podem acessar dados
    - Administradores têm acesso total
*/

-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política para administradores lerem a própria informação
CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserir o usuário administrador especificado
INSERT INTO admin_users (user_id, email)
VALUES ('24151887-fefb-44fe-a2e3-1eef585a9468', 'adilson.martins.jlle@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- Atualizar políticas das petitions para apenas administradores
DROP POLICY IF EXISTS "Users can read petitions" ON petitions;
DROP POLICY IF EXISTS "Users can insert petitions" ON petitions;
DROP POLICY IF EXISTS "Users can update petitions" ON petitions;
DROP POLICY IF EXISTS "Users can delete petitions" ON petitions;

CREATE POLICY "Admins can read petitions"
  ON petitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert petitions"
  ON petitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update petitions"
  ON petitions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete petitions"
  ON petitions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  );
$$;