-- =====================================================
-- MIGRATION: Adicionar campos de auditoria à tabela admin_users
-- Data: 2025-01-21
-- Descrição: Adiciona campos created_by, is_active, updated_at
-- =====================================================

-- Adicionar campos de auditoria à tabela admin_users
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active) WHERE is_active = true;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.admin_users IS 'Tabela de administradores do sistema';
COMMENT ON COLUMN public.admin_users.user_id IS 'UUID real do auth.users (UNIQUE)';
COMMENT ON COLUMN public.admin_users.email IS 'Email do administrador (duplicado para facilitar queries)';
COMMENT ON COLUMN public.admin_users.created_by IS 'UUID do admin que adicionou este registro';
COMMENT ON COLUMN public.admin_users.is_active IS 'Flag para desativação soft delete';
COMMENT ON COLUMN public.admin_users.updated_at IS 'Timestamp da última atualização (auto-atualizado)';
