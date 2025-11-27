-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin_geral', 'gerente_adega', 'operador');

-- Criar enum para status de pagamento
CREATE TYPE public.payment_status AS ENUM ('ativo', 'aguardando', 'bloqueado');

-- Criar enum para categorias de produto
CREATE TYPE public.product_category AS ENUM ('vinho', 'cerveja', 'bebida_quente', 'energetica', 'gelo', 'outros');

-- ============================================================================
-- Tabela de Adegas (Tenants)
-- ============================================================================
CREATE TABLE public.adegas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  status_pagamento payment_status NOT NULL DEFAULT 'aguardando',
  data_ultimo_pagamento TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adegas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabela de Perfis (Profiles)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  adega_id UUID REFERENCES public.adegas(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabela de Roles de Usuário
-- ============================================================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  adega_id UUID REFERENCES public.adegas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, adega_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role de usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin geral
CREATE OR REPLACE FUNCTION public.is_admin_geral(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_geral'
  )
$$;

-- Função para pegar adega_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_adega_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT adega_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- ============================================================================
-- Tabela de Produtos
-- ============================================================================
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adega_id UUID NOT NULL REFERENCES public.adegas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria product_category NOT NULL,
  preco_venda DECIMAL(10, 2) NOT NULL,
  custo DECIMAL(10, 2),
  quantidade_estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  codigo_barras TEXT,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_produtos_adega ON public.produtos(adega_id);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX idx_produtos_estoque ON public.produtos(quantidade_estoque);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabela de Vendas
-- ============================================================================
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adega_id UUID NOT NULL REFERENCES public.adegas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendas_adega ON public.vendas(adega_id);
CREATE INDEX idx_vendas_usuario ON public.vendas(usuario_id);
CREATE INDEX idx_vendas_created ON public.vendas(created_at);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabela de Itens da Venda
-- ============================================================================
CREATE TABLE public.itens_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  nome_produto TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_itens_venda_venda ON public.itens_venda(venda_id);
CREATE INDEX idx_itens_venda_produto ON public.itens_venda(produto_id);

ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Tabela de Logs de Auditoria
-- ============================================================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adega_id UUID REFERENCES public.adegas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_adega ON public.audit_logs(adega_id);
CREATE INDEX idx_audit_logs_usuario ON public.audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Adegas
-- ============================================================================

-- Admin geral vê tudo
CREATE POLICY "Admin geral pode ver todas as adegas"
  ON public.adegas FOR SELECT
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Admin geral pode inserir adegas
CREATE POLICY "Admin geral pode criar adegas"
  ON public.adegas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_geral(auth.uid()));

-- Admin geral pode atualizar adegas
CREATE POLICY "Admin geral pode atualizar adegas"
  ON public.adegas FOR UPDATE
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Gerentes veem apenas sua adega
CREATE POLICY "Gerentes veem sua adega"
  ON public.adegas FOR SELECT
  TO authenticated
  USING (id = public.get_user_adega_id(auth.uid()));

-- ============================================================================
-- RLS POLICIES - Profiles
-- ============================================================================

-- Admin geral vê todos os perfis
CREATE POLICY "Admin geral pode ver todos os perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Usuário vê seu próprio perfil
CREATE POLICY "Usuário vê seu perfil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin geral pode criar perfis
CREATE POLICY "Admin geral pode criar perfis"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_geral(auth.uid()));

-- Admin geral pode atualizar perfis
CREATE POLICY "Admin geral pode atualizar perfis"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Usuário pode atualizar seu próprio perfil
CREATE POLICY "Usuário atualiza seu perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- RLS POLICIES - User Roles
-- ============================================================================

-- Admin geral vê todas as roles
CREATE POLICY "Admin geral vê todas as roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Usuário vê suas próprias roles
CREATE POLICY "Usuário vê suas roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin geral gerencia roles
CREATE POLICY "Admin geral gerencia roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- ============================================================================
-- RLS POLICIES - Produtos
-- ============================================================================

-- Admin geral vê todos os produtos
CREATE POLICY "Admin geral vê todos os produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Usuários veem produtos de sua adega
CREATE POLICY "Usuários veem produtos da adega"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (adega_id = public.get_user_adega_id(auth.uid()));

-- Usuários podem inserir produtos em sua adega
CREATE POLICY "Usuários criam produtos na adega"
  ON public.produtos FOR INSERT
  TO authenticated
  WITH CHECK (adega_id = public.get_user_adega_id(auth.uid()));

-- Usuários podem atualizar produtos de sua adega
CREATE POLICY "Usuários atualizam produtos da adega"
  ON public.produtos FOR UPDATE
  TO authenticated
  USING (adega_id = public.get_user_adega_id(auth.uid()));

-- Gerentes podem deletar produtos
CREATE POLICY "Gerentes deletam produtos"
  ON public.produtos FOR DELETE
  TO authenticated
  USING (
    adega_id = public.get_user_adega_id(auth.uid()) 
    AND (
      public.has_role(auth.uid(), 'gerente_adega') 
      OR public.is_admin_geral(auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES - Vendas
-- ============================================================================

-- Admin geral vê todas as vendas
CREATE POLICY "Admin geral vê todas as vendas"
  ON public.vendas FOR SELECT
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Usuários veem vendas de sua adega
CREATE POLICY "Usuários veem vendas da adega"
  ON public.vendas FOR SELECT
  TO authenticated
  USING (adega_id = public.get_user_adega_id(auth.uid()));

-- Usuários podem criar vendas em sua adega
CREATE POLICY "Usuários criam vendas na adega"
  ON public.vendas FOR INSERT
  TO authenticated
  WITH CHECK (
    adega_id = public.get_user_adega_id(auth.uid())
    AND usuario_id = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES - Itens Venda
-- ============================================================================

-- Admin geral vê todos os itens
CREATE POLICY "Admin geral vê todos os itens"
  ON public.itens_venda FOR SELECT
  TO authenticated
  USING (
    public.is_admin_geral(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendas
      WHERE vendas.id = itens_venda.venda_id
      AND vendas.adega_id = public.get_user_adega_id(auth.uid())
    )
  );

-- Usuários veem itens de vendas de sua adega
CREATE POLICY "Usuários veem itens da adega"
  ON public.itens_venda FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendas
      WHERE vendas.id = itens_venda.venda_id
      AND vendas.adega_id = public.get_user_adega_id(auth.uid())
    )
  );

-- Usuários podem criar itens de venda
CREATE POLICY "Usuários criam itens de venda"
  ON public.itens_venda FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendas
      WHERE vendas.id = itens_venda.venda_id
      AND vendas.usuario_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - Audit Logs
-- ============================================================================

-- Admin geral vê todos os logs
CREATE POLICY "Admin geral vê todos os logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin_geral(auth.uid()));

-- Gerentes veem logs de sua adega
CREATE POLICY "Gerentes veem logs da adega"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    adega_id = public.get_user_adega_id(auth.uid())
    AND public.has_role(auth.uid(), 'gerente_adega')
  );

-- Qualquer usuário autenticado pode criar logs
CREATE POLICY "Usuários criam logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS - Updated At
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_adegas_updated_at
  BEFORE UPDATE ON public.adegas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- TRIGGER - Criar perfil automaticamente ao criar usuário
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TRIGGER - Atualizar estoque após venda
-- ============================================================================

CREATE OR REPLACE FUNCTION public.atualizar_estoque_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Diminuir estoque do produto
  UPDATE public.produtos
  SET quantidade_estoque = quantidade_estoque - NEW.quantidade
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_atualizar_estoque
  AFTER INSERT ON public.itens_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_estoque_venda();