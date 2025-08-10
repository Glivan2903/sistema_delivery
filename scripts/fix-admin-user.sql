-- Script para resolver o problema de autenticação admin
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Verificar se o usuário existe
SELECT id, email, created_at FROM auth.users WHERE email = 'marromlanches@gmail.com';

-- 2. Se o usuário existir, configurar como admin
-- Substitua 'UUID_DO_USUARIO' pelo UUID real retornado na consulta acima
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'marromlanches@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verificar se o usuário foi configurado corretamente
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- 4. Se não houver usuário, criar um novo
-- Descomente e execute as linhas abaixo se precisar criar um usuário

-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) VALUES (
--   gen_random_uuid(),
--   'marromlanches@gmail.com',
--   crypt('sua_senha_aqui', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   '',
--   '',
--   '',
--   ''
-- );

-- 5. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('user_roles', 'categories', 'products')
ORDER BY tablename, policyname;

-- 6. Verificar se a função has_role existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'has_role';

