-- Permitir que gerentes de adega atualizem a logo_url da sua própria adega
CREATE POLICY "Gerentes podem atualizar logo da sua adega"
ON public.adegas
FOR UPDATE
USING (id = get_user_adega_id(auth.uid()) AND has_role(auth.uid(), 'gerente_adega'::app_role))
WITH CHECK (id = get_user_adega_id(auth.uid()) AND has_role(auth.uid(), 'gerente_adega'::app_role));