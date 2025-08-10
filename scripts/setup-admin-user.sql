-- Script para configurar um usuário administrador no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Primeiro, crie um usuário através da interface de autenticação do Supabase
-- Vá para Authentication > Users e crie um novo usuário ou use um existente
-- Anote o UUID do usuário criado

-- 2. Substitua 'SEU_EMAIL_AQUI' pelo email do usuário que você quer tornar admin
-- Substitua 'UUID_DO_USUARIO' pelo UUID real do usuário

-- Opção A: Se você já tem o UUID do usuário
INSERT INTO public.user_roles (user_id, role)
SELECT 'UUID_DO_USUARIO', 'admin'::public.app_role
ON CONFLICT (user_id, role) DO NOTHING;

-- Opção B: Se você quer usar o email para encontrar o usuário
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'SEU_EMAIL_AQUI'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verificar se o usuário foi configurado corretamente
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- 4. Se você quiser remover um usuário admin (opcional)
-- DELETE FROM public.user_roles WHERE user_id = 'UUID_DO_USUARIO' AND role = 'admin';

