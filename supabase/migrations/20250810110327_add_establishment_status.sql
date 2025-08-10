-- Adicionar campo de status do estabelecimento
ALTER TABLE public.company_settings 
ADD COLUMN is_open BOOLEAN DEFAULT true;

-- Atualizar configurações existentes para estar abertas por padrão
UPDATE public.company_settings 
SET is_open = true 
WHERE is_open IS NULL;

-- Adicionar política para permitir leitura pública do status
CREATE POLICY "Público pode ver status do estabelecimento" ON public.company_settings 
FOR SELECT USING (true);

-- Adicionar política para permitir atualização do status apenas por admins
CREATE POLICY "Admin pode atualizar status do estabelecimento" ON public.company_settings 
FOR UPDATE USING (true);
