-- Corrigir políticas que estão permitindo acesso público (anônimo)

-- 1. ADEGAS - Corrigir política de UPDATE para gerentes
DROP POLICY IF EXISTS "Gerentes podem atualizar logo da sua adega" ON public.adegas;
CREATE POLICY "Gerentes podem atualizar logo da sua adega" 
ON public.adegas 
FOR UPDATE 
TO authenticated
USING ((id = get_user_adega_id(auth.uid())) AND has_role(auth.uid(), 'gerente_adega'::app_role))
WITH CHECK ((id = get_user_adega_id(auth.uid())) AND has_role(auth.uid(), 'gerente_adega'::app_role));

-- 2. CATEGORIAS - Corrigir política de SELECT para exigir autenticação
DROP POLICY IF EXISTS "Usuários podem ver categorias ativas" ON public.categorias;
CREATE POLICY "Usuários podem ver categorias ativas" 
ON public.categorias 
FOR SELECT 
TO authenticated
USING ((ativo = true) OR is_admin_geral(auth.uid()));

-- 3. CATEGORIAS_FINANCEIRAS - Corrigir todas as políticas para exigir autenticação
DROP POLICY IF EXISTS "Usuários veem categorias da adega ou sistema" ON public.categorias_financeiras;
CREATE POLICY "Usuários veem categorias da adega ou sistema" 
ON public.categorias_financeiras 
FOR SELECT 
TO authenticated
USING ((adega_id IS NULL) OR (adega_id = get_user_adega_id(auth.uid())) OR is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Gerentes criam categorias" ON public.categorias_financeiras;
CREATE POLICY "Gerentes criam categorias" 
ON public.categorias_financeiras 
FOR INSERT 
TO authenticated
WITH CHECK ((adega_id = get_user_adega_id(auth.uid())) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

DROP POLICY IF EXISTS "Gerentes atualizam categorias" ON public.categorias_financeiras;
CREATE POLICY "Gerentes atualizam categorias" 
ON public.categorias_financeiras 
FOR UPDATE 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

DROP POLICY IF EXISTS "Gerentes deletam categorias" ON public.categorias_financeiras;
CREATE POLICY "Gerentes deletam categorias" 
ON public.categorias_financeiras 
FOR DELETE 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) AND (is_sistema = false) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

-- 4. PROFILES - Corrigir política de SELECT para exigir autenticação
DROP POLICY IF EXISTS "Admin geral pode ver todos os perfis" ON public.profiles;
CREATE POLICY "Admin geral pode ver todos os perfis" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Usuário vê seu perfil" ON public.profiles;
CREATE POLICY "Usuário vê seu perfil" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- 5. PRODUTOS - Corrigir políticas para exigir autenticação
DROP POLICY IF EXISTS "Admin geral vê todos os produtos" ON public.produtos;
CREATE POLICY "Admin geral vê todos os produtos" 
ON public.produtos 
FOR SELECT 
TO authenticated
USING (is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Usuários veem produtos da adega" ON public.produtos;
CREATE POLICY "Usuários veem produtos da adega" 
ON public.produtos 
FOR SELECT 
TO authenticated
USING (adega_id = get_user_adega_id(auth.uid()));

DROP POLICY IF EXISTS "Usuários criam produtos na adega" ON public.produtos;
CREATE POLICY "Usuários criam produtos na adega" 
ON public.produtos 
FOR INSERT 
TO authenticated
WITH CHECK (adega_id = get_user_adega_id(auth.uid()));

DROP POLICY IF EXISTS "Usuários atualizam produtos da adega" ON public.produtos;
CREATE POLICY "Usuários atualizam produtos da adega" 
ON public.produtos 
FOR UPDATE 
TO authenticated
USING (adega_id = get_user_adega_id(auth.uid()));

DROP POLICY IF EXISTS "Gerentes deletam produtos" ON public.produtos;
CREATE POLICY "Gerentes deletam produtos" 
ON public.produtos 
FOR DELETE 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

-- 6. VENDAS - Corrigir políticas para exigir autenticação
DROP POLICY IF EXISTS "Admin geral vê todas as vendas" ON public.vendas;
CREATE POLICY "Admin geral vê todas as vendas" 
ON public.vendas 
FOR SELECT 
TO authenticated
USING (is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Usuários veem vendas da adega" ON public.vendas;
CREATE POLICY "Usuários veem vendas da adega" 
ON public.vendas 
FOR SELECT 
TO authenticated
USING (adega_id = get_user_adega_id(auth.uid()));

DROP POLICY IF EXISTS "Usuários criam vendas na adega" ON public.vendas;
CREATE POLICY "Usuários criam vendas na adega" 
ON public.vendas 
FOR INSERT 
TO authenticated
WITH CHECK ((adega_id = get_user_adega_id(auth.uid())) AND (usuario_id = auth.uid()));

-- 7. ITENS_VENDA - Corrigir políticas para exigir autenticação
DROP POLICY IF EXISTS "Admin geral vê todos os itens" ON public.itens_venda;
CREATE POLICY "Admin geral vê todos os itens" 
ON public.itens_venda 
FOR SELECT 
TO authenticated
USING (is_admin_geral(auth.uid()) OR (EXISTS ( SELECT 1
   FROM vendas
  WHERE ((vendas.id = itens_venda.venda_id) AND (vendas.adega_id = get_user_adega_id(auth.uid()))))));

DROP POLICY IF EXISTS "Usuários veem itens da adega" ON public.itens_venda;
CREATE POLICY "Usuários veem itens da adega" 
ON public.itens_venda 
FOR SELECT 
TO authenticated
USING (EXISTS ( SELECT 1
   FROM vendas
  WHERE ((vendas.id = itens_venda.venda_id) AND (vendas.adega_id = get_user_adega_id(auth.uid())))));

DROP POLICY IF EXISTS "Usuários criam itens de venda" ON public.itens_venda;
CREATE POLICY "Usuários criam itens de venda" 
ON public.itens_venda 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS ( SELECT 1
   FROM vendas
  WHERE ((vendas.id = itens_venda.venda_id) AND (vendas.usuario_id = auth.uid()))));

-- 8. TRANSACOES_FINANCEIRAS - Corrigir políticas para exigir autenticação
DROP POLICY IF EXISTS "Usuários veem transações da adega" ON public.transacoes_financeiras;
CREATE POLICY "Usuários veem transações da adega" 
ON public.transacoes_financeiras 
FOR SELECT 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) OR is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Gerentes criam transações" ON public.transacoes_financeiras;
CREATE POLICY "Gerentes criam transações" 
ON public.transacoes_financeiras 
FOR INSERT 
TO authenticated
WITH CHECK ((adega_id = get_user_adega_id(auth.uid())) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

DROP POLICY IF EXISTS "Gerentes atualizam transações" ON public.transacoes_financeiras;
CREATE POLICY "Gerentes atualizam transações" 
ON public.transacoes_financeiras 
FOR UPDATE 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

DROP POLICY IF EXISTS "Gerentes deletam transações" ON public.transacoes_financeiras;
CREATE POLICY "Gerentes deletam transações" 
ON public.transacoes_financeiras 
FOR DELETE 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) AND (has_role(auth.uid(), 'gerente_adega'::app_role) OR is_admin_geral(auth.uid())));

-- 9. AUDIT_LOGS - Corrigir políticas para exigir autenticação
DROP POLICY IF EXISTS "Admin geral vê todos os logs" ON public.audit_logs;
CREATE POLICY "Admin geral vê todos os logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Gerentes veem logs da adega" ON public.audit_logs;
CREATE POLICY "Gerentes veem logs da adega" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING ((adega_id = get_user_adega_id(auth.uid())) AND has_role(auth.uid(), 'gerente_adega'::app_role));

DROP POLICY IF EXISTS "Usuários criam logs" ON public.audit_logs;
CREATE POLICY "Usuários criam logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 10. USER_ROLES - Corrigir políticas para exigir autenticação
DROP POLICY IF EXISTS "Admin geral vê todas as roles" ON public.user_roles;
CREATE POLICY "Admin geral vê todas as roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (is_admin_geral(auth.uid()));

DROP POLICY IF EXISTS "Usuário vê suas roles" ON public.user_roles;
CREATE POLICY "Usuário vê suas roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin geral gerencia roles" ON public.user_roles;
CREATE POLICY "Admin geral gerencia roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (is_admin_geral(auth.uid()));