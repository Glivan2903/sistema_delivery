-- 🧪 TESTE SIMPLES DE ACESSO - VERIFICAR PROBLEMAS RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário está autenticado
SELECT 
  'Status do usuário' as teste,
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status_email
FROM auth.users 
WHERE email = 'marromlanches@gmail.com';

-- 2. Verificar se o usuário tem papel admin
SELECT 
  'Papel do usuário' as teste,
  ur.role,
  ur.created_at,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ Admin'
    ELSE '❌ Não admin'
  END as status_papel
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'marromlanches@gmail.com';

-- 3. Teste simples de acesso à tabela user_roles (deve funcionar)
SELECT 
  'Teste user_roles' as teste,
  COUNT(*) as total_roles
FROM public.user_roles;

-- 4. Teste de acesso à tabela categories (deve funcionar para admin)
SELECT 
  'Teste categories' as teste,
  COUNT(*) as total_categorias
FROM public.categories;

-- 5. Teste da função has_role
SELECT 
  'Teste has_role' as teste,
  public.has_role(
    (SELECT id FROM auth.users WHERE email = 'marromlanches@gmail.com'),
    'admin'::public.app_role
  ) as tem_papel_admin;

-- 6. Verificar políticas RLS ativas
SELECT 
  'Políticas RLS' as teste,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_roles', 'categories')
ORDER BY tablename, policyname;
