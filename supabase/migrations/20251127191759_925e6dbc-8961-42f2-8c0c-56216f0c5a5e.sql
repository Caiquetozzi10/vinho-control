-- Criar tabela de categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias
CREATE POLICY "Usuários podem ver categorias ativas"
ON public.categorias
FOR SELECT
USING (ativo = true OR is_admin_geral(auth.uid()));

CREATE POLICY "Admin geral pode criar categorias"
ON public.categorias
FOR INSERT
WITH CHECK (is_admin_geral(auth.uid()));

CREATE POLICY "Admin geral pode atualizar categorias"
ON public.categorias
FOR UPDATE
USING (is_admin_geral(auth.uid()));

CREATE POLICY "Admin geral pode deletar categorias"
ON public.categorias
FOR DELETE
USING (is_admin_geral(auth.uid()));

-- Adicionar trigger para updated_at
CREATE TRIGGER update_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();