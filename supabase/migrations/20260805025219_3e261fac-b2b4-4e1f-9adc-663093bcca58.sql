ALTER TABLE public.produtos ALTER COLUMN categoria TYPE text USING categoria::text;

UPDATE public.produtos SET categoria = CASE categoria
  WHEN 'vinho' THEN 'Vinhos'
  WHEN 'cerveja' THEN 'Cerveja'
  WHEN 'bebida_quente' THEN 'Destilados'
  WHEN 'energetica' THEN 'Energéticos'
  WHEN 'gelo' THEN 'Sorvete'
  WHEN 'outros' THEN 'Outros'
  ELSE categoria END;

CREATE UNIQUE INDEX IF NOT EXISTS produtos_adega_codigo_barras_key
  ON public.produtos (adega_id, codigo_barras)
  WHERE codigo_barras IS NOT NULL AND codigo_barras <> '';