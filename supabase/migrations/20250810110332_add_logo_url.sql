-- Adicionar campo logo_url na tabela company_settings
ALTER TABLE public.company_settings 
ADD COLUMN logo_url TEXT;

-- Atualizar tipos do Supabase
COMMENT ON COLUMN public.company_settings.logo_url IS 'URL do logotipo da empresa';
