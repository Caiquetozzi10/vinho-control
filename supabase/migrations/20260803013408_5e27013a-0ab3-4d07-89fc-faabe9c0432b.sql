DROP POLICY IF EXISTS "Bloquear auto-modificação de roles" ON public.user_roles;

CREATE POLICY "Somente admin geral insere roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.is_admin_geral(auth.uid()));

CREATE POLICY "Somente admin geral atualiza roles"
ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
USING (public.is_admin_geral(auth.uid()))
WITH CHECK (public.is_admin_geral(auth.uid()));

CREATE POLICY "Somente admin geral remove roles"
ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.is_admin_geral(auth.uid()));