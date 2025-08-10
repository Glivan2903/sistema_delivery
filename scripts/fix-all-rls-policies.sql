-- 🔧 CORREÇÃO COMPLETA DAS POLÍTICAS RLS - SISTEMA ADMIN
-- Execute este script no SQL Editor do Supabase para corrigir todos os problemas

-- 1. VERIFICAR E CORRIGIR TABELA user_roles
-- Primeiro, vamos garantir que a tabela user_roles tenha as políticas corretas

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Admins gerenciam user_roles" ON public.user_roles;

-- Criar política mais permissiva para user_roles (usuários autenticados podem ler seus próprios papéis)
CREATE POLICY "Usuários podem ler seus próprios papéis" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Política para admins gerenciarem todos os papéis
CREATE POLICY "Admins gerenciam todos os papéis" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. VERIFICAR E CORRIGIR FUNÇÃO has_role
-- Garantir que a função funcione corretamente

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3. CORRIGIR POLÍTICAS DAS TABELAS ADMINISTRATIVAS
-- Garantir que admins possam acessar todas as tabelas

-- Categorias
DROP POLICY IF EXISTS "Admin pode gerenciar categorias" ON public.categories;
CREATE POLICY "Admin pode gerenciar categorias" ON public.categories
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Produtos
DROP POLICY IF EXISTS "Admin pode gerenciar produtos" ON public.products;
CREATE POLICY "Admin pode gerenciar produtos" ON public.products
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Adicionais
DROP POLICY IF EXISTS "Admin pode gerenciar adicionais" ON public.extras;
CREATE POLICY "Admin pode gerenciar adicionais" ON public.extras
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Configurações
DROP POLICY IF EXISTS "Admin pode gerenciar configurações" ON public.company_settings;
CREATE POLICY "Admin pode gerenciar configurações" ON public.company_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Áreas de entrega
DROP POLICY IF EXISTS "Admin pode gerenciar áreas de entrega" ON public.delivery_areas;
CREATE POLICY "Admin pode gerenciar áreas de entrega" ON public.delivery_areas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Formas de pagamento
DROP POLICY IF EXISTS "Admin pode gerenciar métodos de pagamento" ON public.payment_methods;
CREATE POLICY "Admin pode gerenciar métodos de pagamento" ON public.payment_methods
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Pedidos
DROP POLICY IF EXISTS "Admin pode ver todos os pedidos" ON public.orders;
CREATE POLICY "Admin pode ver todos os pedidos" ON public.orders
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin pode atualizar status dos pedidos" ON public.orders;
CREATE POLICY "Admin pode atualizar status dos pedidos" ON public.orders
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Itens do pedido
DROP POLICY IF EXISTS "Admin pode ver itens dos pedidos" ON public.order_items;
CREATE POLICY "Admin pode ver itens dos pedidos" ON public.order_items
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Adicionais dos itens
DROP POLICY IF EXISTS "Admin pode ver adicionais dos itens" ON public.order_item_extras;
CREATE POLICY "Admin pode ver adicionais dos itens" ON public.order_item_extras
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. GARANTIR QUE O USUÁRIO ADMIN EXISTA
-- Verificar se o usuário marromlanches@gmail.com tem papel admin

-- Inserir papel admin se não existir
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'marromlanches@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. TESTAR AS POLÍTICAS
-- Verificar se tudo está funcionando

-- Teste 1: Verificar se o usuário admin pode acessar user_roles
SELECT 
  'Teste 1 - Acesso user_roles' as teste,
  COUNT(*) as total_roles
FROM public.user_roles;

-- Teste 2: Verificar se o usuário admin pode acessar categories
SELECT 
  'Teste 2 - Acesso categories' as teste,
  COUNT(*) as total_categorias
FROM public.categories;

-- Teste 3: Verificar se o usuário admin pode acessar products
SELECT 
  'Teste 3 - Acesso products' as teste,
  COUNT(*) as total_produtos
FROM public.products;

-- Teste 4: Verificar função has_role
SELECT 
  'Teste 4 - Função has_role' as teste,
  public.has_role(
    (SELECT id FROM auth.users WHERE email = 'marromlanches@gmail.com'),
    'admin'::public.app_role
  ) as tem_papel_admin;

-- 6. RESUMO FINAL
-- Mostrar status de todas as correções

SELECT 
  '📊 RESUMO DAS CORREÇÕES' as tipo,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN auth.users u ON ur.user_id = u.id WHERE u.email = 'marromlanches@gmail.com' AND ur.role = 'admin')
    THEN '✅ Usuário admin configurado'
    ELSE '❌ Usuário admin não configurado'
  END as status_usuario,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles')
    THEN '✅ Políticas user_roles ativas'
    ELSE '❌ Políticas user_roles não encontradas'
  END as status_user_roles,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories')
    THEN '✅ Políticas categories ativas'
    ELSE '❌ Políticas categories não encontradas'
  END as status_categories,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role')
    THEN '✅ Função has_role ativa'
    ELSE '❌ Função has_role não encontrada'
  END as status_funcao;
