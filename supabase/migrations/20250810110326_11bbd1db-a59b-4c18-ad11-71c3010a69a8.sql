-- 1) Roles e controle de acesso administrativo
-- Enum de papéis
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff');
  END IF;
END $$;

-- Tabela de papéis de usuário
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar papel
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Política para permitir que admins gerenciem papéis (o primeiro admin será semeado abaixo)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins gerenciam user_roles'
      AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Admins gerenciam user_roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Opcional: semear papel admin para o email conhecido (se existir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'marromlanches@gmail.com'
ON CONFLICT DO NOTHING;

-- 2) Fortalecer RLS nas tabelas administrativas
-- Categorias
DROP POLICY IF EXISTS "Admin pode gerenciar categorias" ON public.categories;
CREATE POLICY "Admin pode gerenciar categorias" ON public.categories
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Produtos
DROP POLICY IF EXISTS "Admin pode gerenciar produtos" ON public.products;
CREATE POLICY "Admin pode gerenciar produtos" ON public.products
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Adicionais
DROP POLICY IF EXISTS "Admin pode gerenciar adicionais" ON public.extras;
CREATE POLICY "Admin pode gerenciar adicionais" ON public.extras
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Configurações
DROP POLICY IF EXISTS "Admin pode gerenciar configurações" ON public.company_settings;
CREATE POLICY "Admin pode gerenciar configurações" ON public.company_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Áreas de entrega
DROP POLICY IF EXISTS "Admin pode gerenciar áreas de entrega" ON public.delivery_areas;
CREATE POLICY "Admin pode gerenciar áreas de entrega" ON public.delivery_areas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Formas de pagamento
DROP POLICY IF EXISTS "Admin pode gerenciar métodos de pagamento" ON public.payment_methods;
CREATE POLICY "Admin pode gerenciar métodos de pagamento" ON public.payment_methods
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Pedidos (somente admins podem ver/atualizar)
DROP POLICY IF EXISTS "Admin pode ver todos os pedidos" ON public.orders;
CREATE POLICY "Admin pode ver todos os pedidos" ON public.orders
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin pode atualizar status dos pedidos" ON public.orders;
CREATE POLICY "Admin pode atualizar status dos pedidos" ON public.orders
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Itens do pedido
DROP POLICY IF EXISTS "Admin pode ver itens dos pedidos" ON public.order_items;
CREATE POLICY "Admin pode ver itens dos pedidos" ON public.order_items
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Adicionais dos itens
DROP POLICY IF EXISTS "Admin pode ver adicionais dos itens" ON public.order_item_extras;
CREATE POLICY "Admin pode ver adicionais dos itens" ON public.order_item_extras
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Alterações na tabela de pedidos: número sequencial e status ampliado
-- Número do pedido sequencial
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'orders_order_number_seq'
  ) THEN
    CREATE SEQUENCE public.orders_order_number_seq;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number BIGINT;

ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON public.orders(order_number);

-- Preencher pedidos existentes (se houver)
UPDATE public.orders SET order_number = nextval('public.orders_order_number_seq')
WHERE order_number IS NULL;

-- Ampliar status permitido (mantendo compatibilidade com o já existente)
DO $$ BEGIN
  -- Tenta remover a constraint se existir com esse nome
  BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'pending', 'accepted', 'out_for_delivery', 'delivered', 'cancelled', -- existentes
      'preparing', 'ready', -- inglês
      'preparando', 'pronto' -- português
    )
  );

-- 4) Realtime para pedidos e itens
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN others THEN NULL; -- ignora se já estiver adicionado
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- 5) Bucket de imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Imagens de produtos públicas'
  ) THEN
    CREATE POLICY "Imagens de produtos públicas"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins podem gerenciar imagens de produtos'
  ) THEN
    CREATE POLICY "Admins podem gerenciar imagens de produtos"
    ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
    WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
