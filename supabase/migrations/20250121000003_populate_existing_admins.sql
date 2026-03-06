-- =====================================================
-- MIGRATION: Popular tabela com admins hardcoded atuais
-- Data: 2025-01-21
-- Descrição: Migra lista hardcoded do AuthContext para o banco
-- IMPORTANTE: Executar ANTES da migration que corrige RLS!
-- =====================================================

-- Inserir admins hardcoded (se ainda não existirem)
-- Usar ON CONFLICT DO NOTHING para evitar erros se já existirem

INSERT INTO public.admin_users (user_id, email, is_active, created_at)
VALUES
    ('624c6a0e-87d9-4005-9f08-9953e8860ad4', 'matheus.mira@cvj.sc.gov.br', true, now()),
    ('24151887-fefb-44fe-a2e3-1eef585a9468', 'adilson.martins.jlle@gmail.com', true, now()),
    ('d3a95b1a-bdec-48a2-b51b-2bcc5d9b0e13', 'admin@teste.com', true, now()),
    ('eea6867e-e65f-4986-8aa1-9ea60e42c5f6', 'andrevitorgoedert4@hotmail.com', true, now()),
    ('5e65d48c-051d-4a24-9d00-51d9f0b985e8', 'mkargel@gmail.com', true, now())
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    is_active = true,
    updated_at = now();

-- Verificar quantos admins foram inseridos/atualizados
DO $$
DECLARE
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.admin_users WHERE is_active = true;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de administradores ativos: %', admin_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Lista de administradores:';
    FOR admin_count IN
        SELECT email FROM public.admin_users WHERE is_active = true ORDER BY email
    LOOP
        RAISE NOTICE '  - %', admin_count;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;

-- Comentário para documentação
COMMENT ON TABLE public.admin_users IS 'Admins migrados de lista hardcoded do AuthContext.tsx em 2025-01-21';
