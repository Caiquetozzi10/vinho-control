-- Adicionar constraint única se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Tornar o usuário admin@admin.com um administrador geral
-- Remove role existente se houver
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- Inserir role de admin_geral
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin_geral'::app_role
FROM auth.users
WHERE email = 'admin@admin.com';

-- Atualizar o perfil
UPDATE public.profiles
SET 
  nome_completo = 'Administrador',
  ativo = true
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@admin.com');