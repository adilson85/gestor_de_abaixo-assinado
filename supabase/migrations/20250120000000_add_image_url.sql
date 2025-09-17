-- Add image_url column to petitions table
ALTER TABLE petitions ADD COLUMN image_url text;

-- Add comment to the column
COMMENT ON COLUMN petitions.image_url IS 'URL da imagem do abaixo-assinado físico armazenada no Supabase Storage';
