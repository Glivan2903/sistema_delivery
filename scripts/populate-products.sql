-- Script para popular o banco de dados com os produtos corretos
-- Baseado nos dados do arquivo products.ts

-- Primeiro, vamos obter os IDs das categorias
WITH category_ids AS (
  SELECT id, name FROM public.categories WHERE active = true
)

-- Inserir produtos (exemplo para algumas categorias principais)
INSERT INTO public.products (name, description, price, category_id, available, preparation_time, rating) VALUES 
-- Sanduíches com Toscana
('X-CALABREZA', 'Sanduíche com calabreza, queijo, alface, tomate e molho especial', 14.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Toscana'), true, 20, 4.7),
('CALABREZA ACEBOLADO', 'Calabreza com cebola refogada, queijo e salada', 15.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Toscana'), true, 22, 4.8),
('EGGES CALABREZA', 'Calabreza com ovo, queijo e acompanhamentos', 16.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Toscana'), true, 20, 4.6),

-- Sanduíches com Frango
('X-FRANGO', 'Frango grelhado, queijo, alface, tomate e molho especial', 13.50, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Frango'), true, 20, 4.7),
('EGGES FRANGO', 'Frango com ovo, queijo e acompanhamentos', 15.50, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Frango'), true, 22, 4.8),
('FRANGO CATUPIRY', 'Frango grelhado com delicioso catupiry', 15.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Frango'), true, 20, 4.8),

-- Sanduíches com Hambúrguer
('HAMBÚRGUER', 'Clássico hambúrguer artesanal com salada', 10.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Hambúrguer'), true, 18, 4.5),
('HAMBÚRGUER ACEBOLADO', 'Hambúrguer com cebola refogada', 11.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Hambúrguer'), true, 20, 4.6),
('X-BURGUER', 'Hambúrguer com queijo e salada', 11.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Hambúrguer'), true, 18, 4.6),

-- Sanduíches com Bacon
('X-BACON', 'Delicioso sanduíche com bacon crocante', 16.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Bacon'), true, 22, 4.8),
('BACON ACEBOLADO', 'Bacon com cebola refogada', 17.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Bacon'), true, 25, 4.8),
('EGGES BACON', 'Bacon com ovo e acompanhamentos', 18.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Bacon'), true, 25, 4.9),

-- Sanduíches com Coração
('X-CORAÇÃO', 'Sanduíche com coração de galinha grelhado', 15.50, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Coração'), true, 25, 4.7),
('CORAÇÃO ACEBOLADO', 'Coração de galinha com cebola refogada', 16.50, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Coração'), true, 25, 4.8),
('EGGES CORAÇÃO', 'Coração de galinha com ovo', 17.50, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Coração'), true, 25, 4.8),

-- Sanduíches com Filé
('X-FILÉ', 'Sanduíche com filé mignon grelhado', 16.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Filé'), true, 25, 4.8),
('FILÉ A CAVALO', 'Filé com ovo montado', 18.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Filé'), true, 25, 4.8),
('FILÉ ESPECIAL', 'Nossa especialidade com filé premium', 19.00, 
 (SELECT id FROM category_ids WHERE name = 'Sanduíches com Filé'), true, 28, 4.9),

-- Cachorro-quente
('SIMPLES', 'Cachorro-quente tradicional', 10.00, 
 (SELECT id FROM category_ids WHERE name = 'Cachorro-quente'), true, 15, 4.5),
('COM FRANGO', 'Cachorro-quente com frango desfiado', 11.00, 
 (SELECT id FROM category_ids WHERE name = 'Cachorro-quente'), true, 18, 4.6),
('MISTO', 'Cachorro-quente misto especial', 13.00, 
 (SELECT id FROM category_ids WHERE name = 'Cachorro-quente'), true, 20, 4.7),

-- Bebidas
('REFRIGERANTE (LATA)', 'Coca-Cola, Pepsi, Guaraná ou Fanta - 350ml', 6.00, 
 (SELECT id FROM category_ids WHERE name = 'Bebidas'), true, 2, 4.5),
('SUCO C/ LEITE', 'Suco natural batido com leite - 400ml', 7.50, 
 (SELECT id FROM category_ids WHERE name = 'Bebidas'), true, 5, 4.7),
('BOMBA BAIANA', 'Bebida especial da casa', 8.00, 
 (SELECT id FROM category_ids WHERE name = 'Bebidas'), true, 8, 4.8);

-- Verificar se foram inseridos corretamente
SELECT 
  p.name as produto,
  c.name as categoria,
  p.price as preco,
  p.available as disponivel
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
WHERE p.available = true
ORDER BY c.sort_order, p.name;
