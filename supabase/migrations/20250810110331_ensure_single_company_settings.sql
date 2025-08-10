-- Garantir apenas um registro na tabela company_settings
-- Manter apenas o registro mais antigo (primeiro criado)
DELETE FROM public.company_settings 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM public.company_settings
  ) t WHERE t.rn = 1
);

-- Atualizar o registro restante com os valores corretos
UPDATE public.company_settings 
SET 
  company_name = 'Marrom Lanches',
  welcome_title = 'Bem-vindo ao',
  subtitle = 'Hambúrguers artesanais irresistíveis, entregues na sua porta com todo carinho',
  address = 'Av. Serafim Bonfim s/n',
  phone = '(79) 99813-0038',
  whatsapp = '79998130038',
  business_hours = 'Segunda a Domingo: 18h às 01h',
  free_delivery_minimum = 35.00,
  delivery_time = '30-45 min',
  is_open = true
WHERE id IN (SELECT id FROM public.company_settings LIMIT 1);
