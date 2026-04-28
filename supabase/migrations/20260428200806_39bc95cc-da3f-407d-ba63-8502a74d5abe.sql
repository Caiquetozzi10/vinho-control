
-- These functions are referenced inside RLS policies on multiple tables
-- (profiles, adegas, user_roles, etc). Postgres requires the calling role
-- to have EXECUTE on functions used in policy expressions, even when those
-- functions are SECURITY DEFINER.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_geral(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_adega_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_stripe_data(uuid) TO authenticated;

-- Trigger functions: only need to be callable by the table owner during trigger
-- execution; do NOT grant to authenticated/anon. Leaving them revoked is correct.
-- (handle_new_user, criar_transacao_venda, atualizar_estoque_venda, create_audit_log)
