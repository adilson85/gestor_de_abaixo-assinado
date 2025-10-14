-- =====================================================
-- SCRIPT PARA VERIFICAR USUÁRIOS NO SUPABASE AUTH
-- =====================================================

-- 1. VERIFICAR USUÁRIOS NA TABELA AUTH.USERS
SELECT 
    'USUÁRIOS NO AUTH.USERS:' as status,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email IN (
    'matheus.mira@cvj.sc.gov.br',
    'adilson.martins.jlle@gmail.com', 
    'andrevitorgoedert4@hotmail.com',
    'mkargel@gmail.com'
)
ORDER BY created_at;

-- 2. VERIFICAR USUÁRIOS NA TABELA ADMIN_USERS
SELECT 
    'USUÁRIOS NO ADMIN_USERS:' as status,
    user_id,
    email,
    created_at
FROM public.admin_users 
ORDER BY created_at;

-- 3. COMPARAR - USUÁRIOS QUE ESTÃO EM ADMIN_USERS MAS NÃO EM AUTH.USERS
SELECT 
    'USUÁRIOS FALTANDO NO AUTH:' as status,
    au.user_id,
    au.email,
    'CRIAR USUÁRIO NO SUPABASE AUTH' as acao
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE u.id IS NULL;

-- 4. COMPARAR - USUÁRIOS QUE ESTÃO EM AUTH.USERS MAS NÃO EM ADMIN_USERS  
SELECT 
    'USUÁRIOS FALTANDO NO ADMIN:' as status,
    u.id as user_id,
    u.email,
    'ADICIONAR À TABELA ADMIN_USERS' as acao
FROM auth.users u
LEFT JOIN public.admin_users au ON u.id = au.user_id
WHERE u.email IN (
    'matheus.mira@cvj.sc.gov.br',
    'adilson.martins.jlle@gmail.com', 
    'andrevitorgoedert4@hotmail.com',
    'mkargel@gmail.com'
)
AND au.user_id IS NULL;

-- 5. VERIFICAR STATUS DE CONFIRMAÇÃO DE EMAIL
SELECT 
    'STATUS DE CONFIRMAÇÃO:' as status,
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmado'
        ELSE '❌ Email NÃO Confirmado'
    END as status_email,
    CASE 
        WHEN last_sign_in_at IS NOT NULL THEN '✅ Já fez login'
        ELSE '❌ Nunca fez login'
    END as status_login
FROM auth.users 
WHERE email IN (
    'matheus.mira@cvj.sc.gov.br',
    'adilson.martins.jlle@gmail.com', 
    'andrevitorgoedert4@hotmail.com',
    'mkargel@gmail.com'
)
ORDER BY email;

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se todos os usuários existem em auth.users
-- 3. Se algum usuário não existir, crie-o via Dashboard:
--    - Authentication → Users → Invite User
--    - Ou Authentication → Users → Add User
-- 4. Confirme se os emails estão verificados
-- 5. Teste o login novamente
--
-- =====================================================
