
DELETE FROM public.user_roles
WHERE user_id = '8017eb46-db8d-4c19-a563-86499f7a9ed6'
  AND role = 'operador';

UPDATE public.profiles
SET adega_id = NULL
WHERE id = '8017eb46-db8d-4c19-a563-86499f7a9ed6';
