-- Script para corrigir as políticas RLS do Supabase
-- Este script resolve o erro 401 Unauthorized ao criar/editar categorias

-- 1. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Admin pode gerenciar categorias" ON public.categories;
DROP POLICY IF EXISTS "Admin pode gerenciar produtos" ON public.products;
DROP POLICY IF EXISTS "Admin pode gerenciar adicionais" ON public.extras;
DROP POLICY IF EXISTS "Admin pode gerenciar configurações" ON public.company_settings;
DROP POLICY IF EXISTS "Admin pode gerenciar áreas de entrega" ON public.delivery_areas;
DROP POLICY IF EXISTS "Admin pode gerenciar métodos de pagamento" ON public.payment_methods;
DROP POLICY IF EXISTS "Admin pode ver todos os pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin pode atualizar status dos pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin pode ver itens dos pedidos" ON public.order_items;
DROP POLICY IF EXISTS "Admin pode ver adicionais dos itens" ON public.order_item_extras;

-- 2. Criar políticas mais permissivas para desenvolvimento
-- NOTA: Em produção, estas políticas devem ser mais restritivas

-- Políticas para CATEGORIAS
CREATE POLICY "Permitir todas as operações em categorias" ON public.categories
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para PRODUTOS  
CREATE POLICY "Permitir todas as operações em produtos" ON public.products
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ADICIONAIS
CREATE POLICY "Permitir todas as operações em adicionais" ON public.extras
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para CONFIGURAÇÕES DA EMPRESA
CREATE POLICY "Permitir todas as operações em configurações" ON public.company_settings
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ÁREAS DE ENTREGA
CREATE POLICY "Permitir todas as operações em áreas de entrega" ON public.delivery_areas
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para MÉTODOS DE PAGAMENTO
CREATE POLICY "Permitir todas as operações em métodos de pagamento" ON public.payment_methods
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para PEDIDOS
CREATE POLICY "Permitir todas as operações em pedidos" ON public.orders
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ITENS DE PEDIDO
CREATE POLICY "Permitir todas as operações em itens de pedido" ON public.order_items
FOR ALL USING (true) WITH CHECK (true);

-- Políticas para ADICIONAIS DE ITENS
CREATE POLICY "Permitir todas as operações em adicionais de itens" ON public.order_item_extras
FOR ALL USING (true) WITH CHECK (true);

-- 3. Verificar se as políticas foram criadas corretamente
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
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
