-- Migration: Garantir leitura pública de petições para Edge Functions e compartilhamento social
-- Esta migration garante que petições disponíveis online possam ser lidas sem autenticação

-- Remover política antiga se existir (para evitar duplicatas)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.petitions;
DROP POLICY IF EXISTS "Enable public read for available online petitions" ON public.petitions;

-- Criar política que permite leitura pública de petições disponíveis online
-- Isso é necessário para Edge Functions e previews de compartilhamento social
CREATE POLICY "Enable public read for available online petitions" 
ON public.petitions 
FOR SELECT 
USING (available_online = true);

-- Também garantir leitura pública de assinaturas para contagem
DROP POLICY IF EXISTS "Enable read access for all users" ON public.signatures;

-- Política que permite leitura pública de assinaturas (apenas para contagem)
CREATE POLICY "Enable public read for signature count" 
ON public.signatures 
FOR SELECT 
USING (true);

-- Comentários explicativos
COMMENT ON POLICY "Enable public read for available online petitions" ON public.petitions IS 
'Permite leitura pública de petições disponíveis online para Edge Functions e previews de redes sociais';

COMMENT ON POLICY "Enable public read for signature count" ON public.signatures IS 
'Permite leitura pública de assinaturas para contagem exibida nas páginas públicas';

