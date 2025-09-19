-- SQL para inserir administradores no Supabase Online
-- Execute este SQL no SQL Editor do Dashboard do Supabase

-- Inserir administradores na tabela admin_users
INSERT INTO public.admin_users (user_id, email) VALUES 
('624c6a0e-87d9-4005-9f08-9953e8860ad4', 'matheus.mira@cvj.sc.gov.br'),
('24151887-fefb-44fe-a2e3-1eef585a9468', 'adilson.martins.jlle@gmail.com');

-- Verificar se os administradores foram inseridos
SELECT * FROM public.admin_users;
