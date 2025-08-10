-- Script para popular o banco de dados com as categorias corretas
-- Baseado na imagem do painel administrativo

-- Limpar categorias existentes (soft delete)
UPDATE public.categories SET active = false WHERE active = true;

-- Inserir as categorias corretas
INSERT INTO public.categories (name, icon, description, sort_order, active) VALUES 
('Sanduíches com Toscana', '🌶️', 'Deliciosos sanduíches com calabreza', 1, true),
('Sanduíches com Frango', '🐔', 'Sanduíches saborosos com frango', 2, true),
('Sanduíches com Hambúrguer', '🍔', 'Clássicos hambúrguers artesanais', 3, true),
('Sanduíches com Bacon', '🥓', 'Irresistíveis com bacon crocante', 4, true),
('Sanduíches com Coração', '❤️', 'Especiais com coração de galinha', 5, true),
('Sanduíches com Filé', '🥩', 'Sofisticados com filé', 6, true),
('Cachorro-quente', '🌭', 'Tradicionais e saborosos', 7, true),
('Bebidas', '🥤', 'Bebidas geladas e refrescantes', 8, true);

-- Verificar se foram inseridas corretamente
SELECT id, name, icon, description, sort_order, active 
FROM public.categories 
WHERE active = true 
ORDER BY sort_order;
