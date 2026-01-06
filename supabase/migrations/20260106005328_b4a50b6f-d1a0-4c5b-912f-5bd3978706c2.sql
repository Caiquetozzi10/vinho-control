-- Adicionar políticas RESTRICTIVAS para bloquear acesso anônimo em todas as tabelas
-- Estas políticas trabalham em conjunto com as existentes para garantir que auth.uid() IS NOT NULL

-- 1. PROFILES - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.profiles 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 2. ADEGAS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.adegas 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 3. TRANSACOES_FINANCEIRAS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.transacoes_financeiras 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 4. VENDAS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.vendas 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 5. PRODUTOS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.produtos 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 6. USER_ROLES - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.user_roles 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 7. AUDIT_LOGS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.audit_logs 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 8. ITENS_VENDA - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.itens_venda 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 9. CATEGORIAS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.categorias 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- 10. CATEGORIAS_FINANCEIRAS - Bloquear acesso anônimo
CREATE POLICY "Bloquear acesso anônimo" 
ON public.categorias_financeiras 
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);