-- Script de teste para verificar sincronização
-- Execute este script para testar se os dados estão sendo sincronizados corretamente

-- 1. Verificar se as tabelas existem e têm dados
SELECT 'Verificando tabelas...' as status;

-- Verificar categorias
SELECT 
  'Categorias' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN active = true THEN 1 END) as ativas
FROM public.categories;

-- Verificar produtos
SELECT 
  'Produtos' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN available = true THEN 1 END) as disponiveis
FROM public.products;

-- 2. Verificar relacionamentos entre categorias e produtos
SELECT 
  'Relacionamentos' as tipo,
  COUNT(DISTINCT p.category_id) as categorias_com_produtos,
  COUNT(p.id) as total_produtos
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
WHERE p.available = true AND c.active = true;

-- 3. Listar categorias ativas com contagem de produtos
SELECT 
  c.name as categoria,
  c.icon as emoji,
  c.description,
  COUNT(p.id) as produtos_disponiveis,
  c.sort_order
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.available = true
WHERE c.active = true
GROUP BY c.id, c.name, c.icon, c.description, c.sort_order
ORDER BY c.sort_order;

-- 4. Listar produtos com suas categorias
SELECT 
  p.name as produto,
  c.name as categoria,
  p.price as preco,
  p.available as disponivel,
  p.description
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
WHERE p.available = true AND c.active = true
ORDER BY c.sort_order, p.name;

-- 5. Verificar se há produtos sem categoria
SELECT 
  'Produtos sem categoria' as problema,
  COUNT(*) as total
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE c.id IS NULL AND p.available = true;

-- 6. Verificar se há categorias sem produtos
SELECT 
  'Categorias sem produtos' as problema,
  COUNT(*) as total
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.available = true
WHERE c.active = true AND p.id IS NULL;

-- 7. Teste de inserção (opcional - descomente para testar)
/*
INSERT INTO public.categories (name, icon, description, sort_order, active) VALUES 
('TESTE CATEGORIA', '🧪', 'Categoria de teste para sincronização', 999, true)
RETURNING id, name, icon, description, sort_order, active;
*/
