-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin geral pode criar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Admin geral pode atualizar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Admin geral pode deletar categorias" ON public.categorias;

-- Create new policies that allow gerente_adega as well
CREATE POLICY "Gerentes e admin podem criar categorias" 
ON public.categorias 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_admin_geral(auth.uid()) OR has_role(auth.uid(), 'gerente_adega'::app_role)
);

CREATE POLICY "Gerentes e admin podem atualizar categorias" 
ON public.categorias 
FOR UPDATE 
TO authenticated
USING (
  is_admin_geral(auth.uid()) OR has_role(auth.uid(), 'gerente_adega'::app_role)
);

CREATE POLICY "Gerentes e admin podem deletar categorias" 
ON public.categorias 
FOR DELETE 
TO authenticated
USING (
  is_admin_geral(auth.uid()) OR has_role(auth.uid(), 'gerente_adega'::app_role)
);