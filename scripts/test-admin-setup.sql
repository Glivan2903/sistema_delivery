-- 🧪 Script de Teste Completo para Configuração Admin
-- Execute este script no SQL Editor do Supabase para verificar se tudo está funcionando

-- 1. Verificar se o enum app_role existe
SELECT 
  'Enum app_role' as tipo,
  enumlabel as valor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role');

-- 2. Verificar se a tabela user_roles existe e tem a estrutura correta
SELECT 
  'Tabela user_roles' as tipo,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;

-- 3. Verificar se o usuário existe em auth.users
SELECT 
  'Usuário Auth' as tipo,
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
    ELSE '❌ Não confirmado'
  END as status_email
FROM auth.users 
WHERE email = 'marromlanches@gmail.com';

-- 4. Verificar se o usuário tem papel de admin
SELECT 
  'Papel Admin' as tipo,
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  u.email,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ Admin'
    ELSE '❌ Não admin'
  END as status_papel
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'marromlanches@gmail.com';

-- 5. Verificar se as políticas RLS estão ativas
SELECT 
  'Políticas RLS' as tipo,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('categories', 'products', 'user_roles')
ORDER BY tablename, policyname;

-- 6. Testar acesso às tabelas principais (deve funcionar para admin)
SELECT 
  'Teste Acesso - Categorias' as tipo,
  COUNT(*) as total_categorias
FROM public.categories;

SELECT 
  'Teste Acesso - Produtos' as tipo,
  COUNT(*) as total_produtos
FROM public.products;

SELECT 
  'Teste Acesso - User Roles' as tipo,
  COUNT(*) as total_roles
FROM public.user_roles;

-- 7. Verificar se a função has_role existe
SELECT 
  'Função has_role' as tipo,
  proname as nome_funcao,
  prosrc as codigo_fonte
FROM pg_proc 
WHERE proname = 'has_role';

-- 8. Testar a função has_role
SELECT 
  'Teste Função has_role' as tipo,
  public.has_role(
    (SELECT id FROM auth.users WHERE email = 'marromlanches@gmail.com'),
    'admin'::public.app_role
  ) as tem_papel_admin;

-- 9. Resumo final
SELECT 
  '📊 RESUMO FINAL' as tipo,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'marromlanches@gmail.com') 
    THEN '✅ Usuário existe'
    ELSE '❌ Usuário não existe'
  END as status_usuario,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN auth.users u ON ur.user_id = u.id WHERE u.email = 'marromlanches@gmail.com' AND ur.role = 'admin')
    THEN '✅ Papel admin atribuído'
    ELSE '❌ Papel admin não atribuído'
  END as status_papel,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories')
    THEN '✅ Políticas RLS ativas'
    ELSE '❌ Políticas RLS não encontradas'
  END as status_rls;
