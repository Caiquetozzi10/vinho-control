
-- 1. pending_registrations: explicit RESTRICTIVE policies blocking all access from authenticated/anon clients
-- (Only service_role via edge functions should access this table)
DROP POLICY IF EXISTS "Block all client access to pending_registrations" ON public.pending_registrations;
CREATE POLICY "Block all client access to pending_registrations"
ON public.pending_registrations
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 2. user_roles: RESTRICTIVE policy preventing non-admins from inserting/updating/deleting their own roles
-- (privilege escalation defense in depth)
DROP POLICY IF EXISTS "Bloquear auto-modificação de roles" ON public.user_roles;
CREATE POLICY "Bloquear auto-modificação de roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.is_admin_geral(auth.uid()))
WITH CHECK (public.is_admin_geral(auth.uid()));

-- 3. Realtime authorization for transacoes_financeiras topic
-- Restrict channel subscriptions to topics scoped to the user's adega_id (topic format: "adega:<adega_id>")
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to their own adega topics" ON realtime.messages;
CREATE POLICY "Users can only subscribe to their own adega topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow if topic matches user's adega scope, or user is admin_geral
  public.is_admin_geral(auth.uid())
  OR (
    realtime.topic() IS NOT NULL
    AND realtime.topic() = 'adega:' || COALESCE(public.get_user_adega_id(auth.uid())::text, '')
  )
);
