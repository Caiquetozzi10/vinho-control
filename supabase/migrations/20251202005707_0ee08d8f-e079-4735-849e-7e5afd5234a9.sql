-- Adicionar coluna de forma de pagamento à tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN forma_pagamento text NOT NULL DEFAULT 'dinheiro';

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.vendas.forma_pagamento IS 'Forma de pagamento: dinheiro, debito, credito, pix';