-- 1. Criar tabela para registros pendentes (armazena dados temporariamente durante checkout)
CREATE TABLE public.pending_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    email text NOT NULL,
    nome_completo text NOT NULL,
    nome_adega text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
    used boolean NOT NULL DEFAULT false
);

-- RLS: Apenas sistema pode acessar (via service role)
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Sem políticas públicas - apenas service role pode acessar

-- 2. Corrigir política de audit_logs - remover INSERT permissivo
DROP POLICY IF EXISTS "Usuários criam logs" ON public.audit_logs;

-- 3. Criar função para inserir logs de auditoria (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_adega_id uuid,
    p_acao text,
    p_tabela text,
    p_registro_id uuid DEFAULT NULL,
    p_detalhes jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO public.audit_logs (adega_id, usuario_id, acao, tabela, registro_id, detalhes)
    VALUES (p_adega_id, auth.uid(), p_acao, p_tabela, p_registro_id, p_detalhes)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- 4. Criar índice para limpeza de registros expirados
CREATE INDEX idx_pending_registrations_expires_at ON public.pending_registrations(expires_at);
CREATE INDEX idx_pending_registrations_token ON public.pending_registrations(token);