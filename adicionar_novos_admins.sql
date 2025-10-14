-- =====================================================
-- SCRIPT PARA ADICIONAR NOVOS ADMINISTRADORES
-- Sistema de Gestão de Abaixo-Assinados - Prefeitura de Joinville
-- =====================================================

-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard
-- ou via CLI com privilégios de service_role

-- =====================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. VERIFICAR ADMINISTRADORES EXISTENTES
-- =====================================================
SELECT 'ADMINISTRADORES EXISTENTES:' as status;
SELECT user_id, email, created_at FROM public.admin_users ORDER BY created_at;

-- =====================================================
-- 3. INSERIR NOVOS ADMINISTRADORES (IGNORANDO DUPLICATAS)
-- =====================================================
INSERT INTO public.admin_users (user_id, email) VALUES 
('eea6867e-e65f-4986-8aa1-9ea60e42c5f6', 'andrevitorgoedert4@hotmail.com'),
('5e65d48c-051d-4a24-9d00-51d9f0b985e8', 'mkargel@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 4. REABILITAR RLS
-- =====================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. VERIFICAR SE OS ADMINISTRADORES FORAM INSERIDOS
-- =====================================================
SELECT 
    id,
    user_id,
    email,
    created_at
FROM public.admin_users 
ORDER BY created_at DESC;

-- =====================================================
-- 6. VERIFICAR TOTAL DE ADMINISTRADORES
-- =====================================================
SELECT 
    COUNT(*) as total_administradores,
    COUNT(CASE WHEN email LIKE '%@cvj.sc.gov.br' THEN 1 END) as admins_prefeitura,
    COUNT(CASE WHEN email LIKE '%@gmail.com' THEN 1 END) as admins_gmail,
    COUNT(CASE WHEN email LIKE '%@hotmail.com' THEN 1 END) as admins_hotmail
FROM public.admin_users;

-- =====================================================
-- 7. LISTAR TODOS OS ADMINISTRADORES ATIVOS
-- =====================================================
SELECT 
    'Matheus Mira' as nome,
    'matheus.mira@cvj.sc.gov.br' as email,
    '624c6a0e-87d9-4005-9f08-9953e8860ad4' as user_id
UNION ALL
SELECT 
    'Adilson Martins' as nome,
    'adilson.martins.jlle@gmail.com' as email,
    '24151887-fefb-44fe-a2e3-1eef585a9468' as user_id
UNION ALL
SELECT 
    'André Vitor Goedert' as nome,
    'andrevitorgoedert4@hotmail.com' as email,
    'eea6867e-e65f-4986-8aa1-9ea60e42c5f6' as user_id
UNION ALL
SELECT 
    'Márcio Kargel' as nome,
    'mkargel@gmail.com' as email,
    '5e65d48c-051d-4a24-9d00-51d9f0b985e8' as user_id
ORDER BY nome;

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- =====================================================
-- 
-- OPÇÃO 1 - Via Supabase Dashboard:
-- 1. Acesse https://supabase.com/dashboard
-- 2. Vá para seu projeto
-- 3. Clique em "SQL Editor"
-- 4. Cole este script completo
-- 5. Clique em "Run"
--
-- OPÇÃO 2 - Via CLI (se configurado):
-- npx supabase db reset --db-url "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
--
-- OPÇÃO 3 - Via psql direto:
-- psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f adicionar_novos_admins.sql
--
-- =====================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO:
-- =====================================================
-- 
-- 1. Verifique se os 4 administradores aparecem na consulta
-- 2. Confirme que os emails estão corretos
-- 3. Teste o login dos novos usuários no sistema
-- 4. Verifique se eles têm acesso administrativo
--
-- =====================================================
