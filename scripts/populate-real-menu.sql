-- Script para popular o cardápio real do Marrom Lanches
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Limpar dados existentes (opcional - descomente se quiser resetar)
-- DELETE FROM public.products;
-- DELETE FROM public.categories;

-- 2. Atualizar/Inserir categorias corretas
INSERT INTO public.categories (name, icon, description, sort_order, active) VALUES 
('Sanduíches com Toscana', '🌶️', 'Deliciosos sanduíches com linguiça toscana', 1, true),
('Sanduíches com Frango', '🐔', 'Sanduíches saborosos com frango', 2, true),
('Sanduíches com Hambúrguer', '🍔', 'Hambúrgueres artesanais', 3, true),
('Sanduíches com Bacon', '🥓', 'Sanduíches com bacon crocante', 4, true),
('Sanduíches com Coração de Galinha', '❤️', 'Sanduíches especiais com coração', 5, true),
('Sanduíches com Filé', '🥩', 'Sanduíches premium com filé', 6, true),
('Cachorro-quente', '🌭', 'Cachorros-quentes tradicionais', 7, true),
('Bebidas', '🥤', 'Refrigerantes e sucos naturais', 8, true)
ON CONFLICT (name) DO UPDATE SET 
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- 3. Inserir produtos do cardápio real

-- Sanduíches com Toscana
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('X-CALABREZA', 'Sanduíche com linguiça toscana, queijo, alface e tomate', 14.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, ''),
('CALABREZA ACEBOLADO', 'Sanduíche com linguiça toscana e cebola caramelizada', 15.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, ''),
('EGGES CALABREZA', 'Sanduíche com linguiça toscana e ovo', 16.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, ''),
('RANGO CALABREZA', 'Sanduíche com linguiça toscana, queijo, presunto e ovo', 17.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, ''),
('CALABREZA AO FRANGO', 'Sanduíche com linguiça toscana e frango', 18.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, ''),
('BIG CALABREZA', 'Sanduíche grande com linguiça toscana e ingredientes especiais', 21.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, ''),
('CALABREZA ESPECIAL', 'Sanduíche especial com linguiça toscana e todos os acompanhamentos', 20.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Toscana'), true, '');

-- Sanduíches com Frango
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('X-FRANGO', 'Sanduíche com frango, queijo, alface e tomate', 13.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Frango'), true, ''),
('EGGES FRANGO', 'Sanduíche com frango e ovo', 15.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Frango'), true, ''),
('FRANGO CATUPIRY', 'Sanduíche com frango e catupiry', 15.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Frango'), true, ''),
('FRANGO RURAL', 'Sanduíche com frango rural e ingredientes especiais', 15.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Frango'), true, ''),
('RANGO FRANGO', 'Sanduíche com frango, queijo, presunto e ovo', 16.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Frango'), true, ''),
('FRANGO ESPECIAL', 'Sanduíche especial com frango e todos os acompanhamentos', 17.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Frango'), true, '');

-- Sanduíches com Hambúrguer
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('HAMBÚRGUER', 'Hambúrguer tradicional com queijo, alface e tomate', 10.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('HAMBÚRGUER ACEBOLADO', 'Hambúrguer com cebola caramelizada', 11.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('MISTO QUENTE', 'Sanduíche misto quente tradicional', 9.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('BAURÚ', 'Sanduíche baurú tradicional', 10.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('AMERICANO', 'Hambúrguer estilo americano', 10.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('X-BURGUER', 'Hambúrguer com queijo, alface e tomate', 11.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('EGGES-BURGUER', 'Hambúrguer com ovo', 13.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('RANGO BURGUER', 'Hambúrguer com queijo, presunto e ovo', 15.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('SUPER RANGO', 'Hambúrguer super rango com ingredientes especiais', 15.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('HAMBÚRGÃO', 'Hambúrguer grande com todos os acompanhamentos', 16.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('HAMBÚRGUER AO FRANGO', 'Hambúrguer com frango', 16.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, ''),
('ALAZANHADO', 'Hambúrguer alazanhado especial', 18.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Hambúrguer'), true, '');

-- Sanduíches com Bacon
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('X-BACON', 'Sanduíche com bacon, queijo, alface e tomate', 16.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Bacon'), true, ''),
('BACON ACEBOLADO', 'Sanduíche com bacon e cebola caramelizada', 17.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Bacon'), true, ''),
('EGGES BACON', 'Sanduíche com bacon e ovo', 18.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Bacon'), true, ''),
('BACON ESPECIAL', 'Sanduíche especial com bacon e ingredientes premium', 19.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Bacon'), true, '');

-- Sanduíches com Coração de Galinha
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('X-CORAÇÃO', 'Sanduíche com coração de galinha, queijo, alface e tomate', 15.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Coração de Galinha'), true, ''),
('CORAÇÃO ACEBOLADO', 'Sanduíche com coração de galinha e cebola caramelizada', 16.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Coração de Galinha'), true, ''),
('EGGES CORAÇÃO', 'Sanduíche com coração de galinha e ovo', 17.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Coração de Galinha'), true, ''),
('CORAÇÃO AO FRANGO', 'Sanduíche com coração de galinha e frango', 18.50, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Coração de Galinha'), true, ''),
('CORAÇÃO AO FRANGO COMPLETO', 'Sanduíche completo com coração de galinha e frango', 21.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Coração de Galinha'), true, ''),
('CORAÇÃO ESPECIAL', 'Sanduíche especial com coração de galinha e ingredientes premium', 23.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Coração de Galinha'), true, '');

-- Sanduíches com Filé
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('X-FILÉ', 'Sanduíche com filé, queijo, alface e tomate', 16.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Filé'), true, ''),
('FILÉ A CAVALO', 'Sanduíche com filé e ovo a cavalo', 18.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Filé'), true, ''),
('FILÉ ACEBOLADO', 'Sanduíche com filé e cebola caramelizada', 17.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Filé'), true, ''),
('FILÉ ESPECIAL', 'Sanduíche especial com filé e ingredientes premium', 19.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Filé'), true, ''),
('SUPER FILÉ', 'Sanduíche super filé com todos os acompanhamentos', 22.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Filé'), true, ''),
('ESPECIAL DA CASA', 'Sanduíche especial da casa com filé premium', 32.00, 
 (SELECT id FROM public.categories WHERE name = 'Sanduíches com Filé'), true, '');

-- Cachorro-quente
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('SIMPLES', 'Cachorro-quente simples com salsicha, mostarda e ketchup', 10.00, 
 (SELECT id FROM public.categories WHERE name = 'Cachorro-quente'), true, ''),
('COM FRANGO', 'Cachorro-quente com frango desfiado', 11.00, 
 (SELECT id FROM public.categories WHERE name = 'Cachorro-quente'), true, ''),
('COM CARNE', 'Cachorro-quente com carne moída', 11.00, 
 (SELECT id FROM public.categories WHERE name = 'Cachorro-quente'), true, ''),
('MISTO', 'Cachorro-quente misto com todos os ingredientes', 13.00, 
 (SELECT id FROM public.categories WHERE name = 'Cachorro-quente'), true, ''),
('PIZZA BROTINHO', 'Pizza brotinho individual', 6.50, 
 (SELECT id FROM public.categories WHERE name = 'Cachorro-quente'), true, '');

-- Bebidas
INSERT INTO public.products (name, description, price, category_id, available, image) VALUES 
('REFRIGERANTE (LATA)', 'Refrigerante em lata 350ml', 6.00, 
 (SELECT id FROM public.categories WHERE name = 'Bebidas'), true, ''),
('REFRIGERANTE 1 LITRO', 'Refrigerante 1 litro', 9.00, 
 (SELECT id FROM public.categories WHERE name = 'Bebidas'), true, ''),
('REFRIGERANTE 2 LITROS', 'Refrigerante 2 litros', 13.00, 
 (SELECT id FROM public.categories WHERE name = 'Bebidas'), true, ''),
('SUCO C/ LEITE', 'Suco natural com leite', 7.50, 
 (SELECT id FROM public.categories WHERE name = 'Bebidas'), true, ''),
('SUCO S/ LEITE', 'Suco natural sem leite', 6.50, 
 (SELECT id FROM public.categories WHERE name = 'Bebidas'), true, ''),
('BOMBA BAIANA', 'Bomba baiana tradicional', 8.00, 
 (SELECT id FROM public.categories WHERE name = 'Bebidas'), true, '');

-- 4. Verificar os dados inseridos
SELECT 
  c.name as categoria,
  p.name as produto,
  p.price as preco,
  p.available as disponivel
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
WHERE c.active = true AND p.available = true
ORDER BY c.sort_order, p.name;
