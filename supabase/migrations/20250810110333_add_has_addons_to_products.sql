-- Adicionar campo has_addons na tabela products
ALTER TABLE public.products 
ADD COLUMN has_addons BOOLEAN DEFAULT false;

-- Atualizar tipos do Supabase
COMMENT ON COLUMN public.products.has_addons IS 'Indica se o produto possui adicionais disponíveis';
