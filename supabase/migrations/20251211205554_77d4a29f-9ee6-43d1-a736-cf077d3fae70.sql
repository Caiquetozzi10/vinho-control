-- Adicionar campo logo_url na tabela adegas
ALTER TABLE public.adegas ADD COLUMN IF NOT EXISTS logo_url text;

-- Criar bucket para logos das adegas
INSERT INTO storage.buckets (id, name, public)
VALUES ('adega-logos', 'adega-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que admin geral faça upload de logos
CREATE POLICY "Admin geral pode fazer upload de logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'adega-logos' 
  AND is_admin_geral(auth.uid())
);

-- Política para permitir que admin geral atualize logos
CREATE POLICY "Admin geral pode atualizar logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'adega-logos' 
  AND is_admin_geral(auth.uid())
);

-- Política para permitir que admin geral delete logos
CREATE POLICY "Admin geral pode deletar logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'adega-logos' 
  AND is_admin_geral(auth.uid())
);

-- Política para permitir que todos vejam logos (bucket público)
CREATE POLICY "Todos podem ver logos das adegas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'adega-logos');