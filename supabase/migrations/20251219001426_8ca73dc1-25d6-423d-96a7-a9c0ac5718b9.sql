-- Adicionar plano diamante ao enum
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'diamante';

-- Criar tabela de categorias financeiras
CREATE TABLE public.categorias_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adega_id UUID REFERENCES public.adegas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  cor TEXT DEFAULT '#6b7280',
  icone TEXT DEFAULT 'circle',
  is_sistema BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de transações financeiras
CREATE TABLE public.transacoes_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adega_id UUID NOT NULL REFERENCES public.adegas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias_financeiras(id) ON DELETE SET NULL,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  descricao TEXT,
  data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  observacoes TEXT,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'venda', 'estoque')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- RLS Policies para categorias_financeiras
CREATE POLICY "Usuários veem categorias da adega ou sistema"
ON public.categorias_financeiras
FOR SELECT
USING (
  adega_id IS NULL OR 
  adega_id = get_user_adega_id(auth.uid()) OR 
  is_admin_geral(auth.uid())
);

CREATE POLICY "Gerentes criam categorias"
ON public.categorias_financeiras
FOR INSERT
WITH CHECK (
  adega_id = get_user_adega_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gerente_adega') OR is_admin_geral(auth.uid()))
);

CREATE POLICY "Gerentes atualizam categorias"
ON public.categorias_financeiras
FOR UPDATE
USING (
  adega_id = get_user_adega_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gerente_adega') OR is_admin_geral(auth.uid()))
);

CREATE POLICY "Gerentes deletam categorias"
ON public.categorias_financeiras
FOR DELETE
USING (
  adega_id = get_user_adega_id(auth.uid()) AND 
  is_sistema = false AND
  (has_role(auth.uid(), 'gerente_adega') OR is_admin_geral(auth.uid()))
);

-- RLS Policies para transacoes_financeiras
CREATE POLICY "Usuários veem transações da adega"
ON public.transacoes_financeiras
FOR SELECT
USING (
  adega_id = get_user_adega_id(auth.uid()) OR 
  is_admin_geral(auth.uid())
);

CREATE POLICY "Gerentes criam transações"
ON public.transacoes_financeiras
FOR INSERT
WITH CHECK (
  adega_id = get_user_adega_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gerente_adega') OR is_admin_geral(auth.uid()))
);

CREATE POLICY "Gerentes atualizam transações"
ON public.transacoes_financeiras
FOR UPDATE
USING (
  adega_id = get_user_adega_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gerente_adega') OR is_admin_geral(auth.uid()))
);

CREATE POLICY "Gerentes deletam transações"
ON public.transacoes_financeiras
FOR DELETE
USING (
  adega_id = get_user_adega_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gerente_adega') OR is_admin_geral(auth.uid()))
);

-- Trigger para updated_at
CREATE TRIGGER update_categorias_financeiras_updated_at
BEFORE UPDATE ON public.categorias_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transacoes_financeiras_updated_at
BEFORE UPDATE ON public.transacoes_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão do sistema (sem adega_id = disponível para todos)
INSERT INTO public.categorias_financeiras (adega_id, nome, tipo, cor, icone, is_sistema) VALUES
(NULL, 'Vendas', 'entrada', '#22c55e', 'shopping-cart', true),
(NULL, 'Recebimentos', 'entrada', '#3b82f6', 'wallet', true),
(NULL, 'Outros Créditos', 'entrada', '#8b5cf6', 'plus-circle', true),
(NULL, 'Compra de Mercadorias', 'saida', '#ef4444', 'package', true),
(NULL, 'Aluguel', 'saida', '#f97316', 'home', true),
(NULL, 'Energia Elétrica', 'saida', '#eab308', 'zap', true),
(NULL, 'Água', 'saida', '#06b6d4', 'droplet', true),
(NULL, 'Salários', 'saida', '#ec4899', 'users', true),
(NULL, 'Impostos', 'saida', '#6b7280', 'file-text', true),
(NULL, 'Marketing', 'saida', '#a855f7', 'megaphone', true),
(NULL, 'Manutenção', 'saida', '#78716c', 'wrench', true),
(NULL, 'Outras Despesas', 'saida', '#64748b', 'minus-circle', true);

-- Função para criar transação automática de venda
CREATE OR REPLACE FUNCTION public.criar_transacao_venda()
RETURNS TRIGGER AS $$
DECLARE
  categoria_vendas_id UUID;
BEGIN
  -- Buscar categoria de vendas
  SELECT id INTO categoria_vendas_id 
  FROM public.categorias_financeiras 
  WHERE nome = 'Vendas' AND is_sistema = true 
  LIMIT 1;
  
  -- Criar transação de entrada
  INSERT INTO public.transacoes_financeiras (
    adega_id,
    categoria_id,
    venda_id,
    tipo,
    valor,
    descricao,
    data_transacao,
    forma_pagamento,
    origem
  ) VALUES (
    NEW.adega_id,
    categoria_vendas_id,
    NEW.id,
    'entrada',
    NEW.valor_total,
    'Venda #' || LEFT(NEW.id::text, 8),
    NEW.created_at::date,
    NEW.forma_pagamento,
    'venda'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar transação automática quando uma venda é criada
CREATE TRIGGER criar_transacao_apos_venda
AFTER INSERT ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.criar_transacao_venda();

-- Habilitar realtime para transações
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_financeiras;