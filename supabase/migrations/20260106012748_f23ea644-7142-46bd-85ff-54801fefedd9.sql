-- Criar view pública que oculta dados sensíveis do Stripe
CREATE OR REPLACE VIEW public.adegas_public AS
SELECT 
  id,
  nome,
  email,
  telefone,
  endereco,
  logo_url,
  plano,
  status_pagamento,
  data_ultimo_pagamento,
  is_trial,
  trial_expires_at,
  ativo,
  created_at,
  updated_at
FROM public.adegas;

-- Dar permissões de SELECT na view
GRANT SELECT ON public.adegas_public TO authenticated;

-- Criar função para verificar se usuário pode ver dados completos
CREATE OR REPLACE FUNCTION public.can_view_stripe_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_geral(_user_id)
$$;

COMMENT ON VIEW public.adegas_public IS 'View pública da tabela adegas sem dados sensíveis do Stripe';