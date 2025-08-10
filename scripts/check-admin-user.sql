-- Script para verificar e configurar usuário admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'marromlanches@gmail.com';

-- 2. Verificar se o usuário já tem papel de admin
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'marromlanches@gmail.com';

-- 3. Se o usuário não tiver papel de admin, adicionar
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'marromlanches@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Verificar se as políticas RLS estão funcionando
-- Esta consulta deve falhar para usuários não-admin (por RLS)
-- e funcionar para usuários admin
SELECT 
  'Teste de permissões RLS' as status,
  COUNT(*) as categorias_visiveis
FROM public.categories;
