-- Recriar view com SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.adegas_public;

CREATE VIEW public.adegas_public 
WITH (security_invoker = true) AS
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

COMMENT ON VIEW public.adegas_public IS 'View pública da tabela adegas sem dados sensíveis do Stripe';