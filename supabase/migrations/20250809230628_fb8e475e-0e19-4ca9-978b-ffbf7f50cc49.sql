-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  ingredients TEXT[],
  preparation_time INTEGER,
  available BOOLEAN DEFAULT true,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de adicionais
CREATE TABLE public.extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de configurações da empresa
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Marrom Lanches',
  welcome_title TEXT DEFAULT 'Bem-vindo ao',
  subtitle TEXT DEFAULT 'Hambúrguers artesanais irresistíveis, entregues na sua porta com todo carinho',
  address TEXT DEFAULT 'Av. Serafim Bonfim s/n',
  phone TEXT DEFAULT '(79) 99813-0038',
  whatsapp TEXT DEFAULT '79998130038',
  business_hours TEXT DEFAULT 'Segunda a Domingo: 18h às 01h',
  free_delivery_minimum DECIMAL(10,2) DEFAULT 35.00,
  delivery_time TEXT DEFAULT '30-45 min',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de áreas de entrega
CREATE TABLE public.delivery_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de métodos de pagamento
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  payment_method TEXT NOT NULL,
  delivery_area_id UUID REFERENCES public.delivery_areas(id),
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'out_for_delivery', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de adicionais dos itens do pedido
CREATE TABLE public.order_item_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  extra_id UUID REFERENCES public.extras(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_extras ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura (dados do cardápio)
CREATE POLICY "Público pode ver categorias ativas" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Público pode ver produtos disponíveis" ON public.products FOR SELECT USING (available = true);
CREATE POLICY "Público pode ver adicionais ativos" ON public.extras FOR SELECT USING (active = true);
CREATE POLICY "Público pode ver configurações da empresa" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Público pode ver áreas de entrega ativas" ON public.delivery_areas FOR SELECT USING (active = true);
CREATE POLICY "Público pode ver métodos de pagamento ativos" ON public.payment_methods FOR SELECT USING (active = true);

-- Políticas para pedidos (acesso público para inserção)
CREATE POLICY "Público pode criar pedidos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Público pode criar itens de pedido" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Público pode criar adicionais de itens" ON public.order_item_extras FOR INSERT WITH CHECK (true);

-- Políticas administrativas (temporárias - permitindo acesso total)
CREATE POLICY "Admin pode gerenciar categorias" ON public.categories FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar produtos" ON public.products FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar adicionais" ON public.extras FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar configurações" ON public.company_settings FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar áreas de entrega" ON public.delivery_areas FOR ALL USING (true);
CREATE POLICY "Admin pode gerenciar métodos de pagamento" ON public.payment_methods FOR ALL USING (true);
CREATE POLICY "Admin pode ver todos os pedidos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admin pode atualizar status dos pedidos" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Admin pode ver itens dos pedidos" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Admin pode ver adicionais dos itens" ON public.order_item_extras FOR SELECT USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_extras_updated_at BEFORE UPDATE ON public.extras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_areas_updated_at BEFORE UPDATE ON public.delivery_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais das categorias
INSERT INTO public.categories (name, icon, description, sort_order) VALUES 
('Hambúrgueres', '🍔', 'Deliciosos hambúrguers artesanais', 1),
('Batata', '🍟', 'Batatas fritas e especiais', 2),
('Bebidas', '🥤', 'Refrigerantes e sucos naturais', 3),
('Sobremesas', '🍰', 'Doces e sobremesas especiais', 4),
('Combos', '🍽️', 'Combos especiais com desconto', 5);

-- Inserir configurações iniciais da empresa
INSERT INTO public.company_settings (id) VALUES (gen_random_uuid());

-- Inserir áreas de entrega iniciais
INSERT INTO public.delivery_areas (name, fee) VALUES 
('Centro', 0),
('Bairro Novo', 3.50),
('Industrial', 5.00);

-- Inserir métodos de pagamento iniciais
INSERT INTO public.payment_methods (name) VALUES 
('Dinheiro'),
('PIX'),
('Cartão de Débito'),
('Cartão de Crédito'),
('Vale Alimentação');

-- Inserir alguns adicionais iniciais
INSERT INTO public.extras (name, price) VALUES 
('Bacon Extra', 3.00),
('Queijo Extra', 2.50),
('Ovo', 2.00),
('Catupiry', 3.50),
('Cheddar', 3.00);