/*
  Tabela de links (YouTube / Google Drive / outros) associados a um abaixo-assinado
*/

CREATE TABLE IF NOT EXISTS petition_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id uuid NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('youtube','drive','link')),
  title text,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE petition_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view petition resources"
  ON petition_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert petition resources"
  ON petition_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete petition resources"
  ON petition_resources
  FOR DELETE
  TO authenticated
  USING (true);


