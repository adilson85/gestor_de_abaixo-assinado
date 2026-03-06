-- =====================================================
-- MIGRATION: Criar tabela de auditoria para ações de administradores
-- Data: 2025-01-21
-- Descrição: Registra todas as ações de adicionar/remover admins
-- =====================================================

-- Criar tabela de auditoria para ações de administradores
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    action_type text NOT NULL,
    actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_email text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Criar índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_id ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_email ON public.admin_audit_log(target_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON public.admin_audit_log(action_type);

-- Habilitar RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ler logs
CREATE POLICY "Admins can read audit logs" ON public.admin_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Service role pode inserir (para Edge Functions)
CREATE POLICY "Service role can insert audit logs" ON public.admin_audit_log
    FOR INSERT
    WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.admin_audit_log IS 'Log de auditoria de ações administrativas';
COMMENT ON COLUMN public.admin_audit_log.action_type IS 'Tipo de ação: ADMIN_ADDED, ADMIN_REMOVED, etc.';
COMMENT ON COLUMN public.admin_audit_log.actor_id IS 'Quem executou a ação (UUID do auth.users)';
COMMENT ON COLUMN public.admin_audit_log.target_email IS 'Email afetado pela ação';
COMMENT ON COLUMN public.admin_audit_log.details IS 'Detalhes adicionais em JSON (userId, created, etc.)';
