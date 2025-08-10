-- Atualizar dados da company_settings com valores corretos
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
WHERE company_name IS NULL OR company_name = '';

-- Garantir que há pelo menos um registro
INSERT INTO public.company_settings (
  company_name,
  welcome_title,
  subtitle,
  address,
  phone,
  whatsapp,
  business_hours,
  free_delivery_minimum,
  delivery_time,
  is_open
) VALUES (
  'Marrom Lanches',
  'Bem-vindo ao',
  'Hambúrguers artesanais irresistíveis, entregues na sua porta com todo carinho',
  'Av. Serafim Bonfim s/n',
  '(79) 99813-0038',
  '79998130038',
  'Segunda a Domingo: 18h às 01h',
  35.00,
  '30-45 min',
  true
) ON CONFLICT DO NOTHING;
