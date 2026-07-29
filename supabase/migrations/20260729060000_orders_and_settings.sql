-- ============ Site settings: WhatsApp number + delivery charges ============
INSERT INTO public.app_settings (key, value) VALUES
  ('whatsapp_number', '"8801577142710"'::jsonb),
  ('delivery_charge_dhaka', '80'::jsonb),
  ('delivery_charge_outside_dhaka', '130'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============ Orders ============
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending', 'confirmed', 'printing', 'packed', 'shipped', 'delivered', 'cancelled', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE,

  customer_name text NOT NULL,
  phone text NOT NULL,
  district text NOT NULL,
  area text NOT NULL,
  address text NOT NULL,
  note text,

  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_url text,
  color_name text,
  size_name text,
  quantity int NOT NULL DEFAULT 1,

  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  delivery_charge numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,

  status public.order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS ix_orders_created ON public.orders(created_at DESC);

GRANT SELECT ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous storefront customers) can create a pending order.
DROP POLICY IF EXISTS "orders public insert" ON public.orders;
CREATE POLICY "orders public insert" ON public.orders
  FOR INSERT WITH CHECK (status = 'pending');

-- Only the admin can read the order list (customers never see other customers' orders).
DROP POLICY IF EXISTS "orders admin read" ON public.orders;
CREATE POLICY "orders admin read" ON public.orders
  FOR SELECT TO authenticated USING (public.is_zyvro_admin());

DROP POLICY IF EXISTS "orders admin write" ON public.orders;
CREATE POLICY "orders admin write" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());

DROP POLICY IF EXISTS "orders admin delete" ON public.orders;
CREATE POLICY "orders admin delete" ON public.orders
  FOR DELETE TO authenticated USING (public.is_zyvro_admin());

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Human-friendly order number, e.g. ZYV-000001
CREATE SEQUENCE IF NOT EXISTS public.orders_order_no_seq;
CREATE OR REPLACE FUNCTION public.tg_orders_set_order_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_no IS NULL OR NEW.order_no = '' THEN
    NEW.order_no := 'ZYV-' || lpad(nextval('public.orders_order_no_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_orders_set_order_no ON public.orders;
CREATE TRIGGER trg_orders_set_order_no BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_orders_set_order_no();

-- Realtime so the admin dashboard gets instant new-order notifications.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
