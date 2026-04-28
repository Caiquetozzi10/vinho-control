
-- Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated.
-- These functions are used internally by RLS policies and triggers (which run with the table owner's privileges)
-- and do NOT need to be callable directly by client roles via PostgREST.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_geral(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_adega_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_view_stripe_data(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_audit_log(uuid, text, text, uuid, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.criar_transacao_venda() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.atualizar_estoque_venda() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Storage: remove duplicate broad SELECT policy on adega-logos to satisfy "Public Bucket Allows Listing".
-- The bucket is public so direct URL access still works; we just don't expose listing via storage.objects.
DROP POLICY IF EXISTS "Todos podem ver logos das adegas" ON storage.objects;
DROP POLICY IF EXISTS "Public can view adega logos" ON storage.objects;
