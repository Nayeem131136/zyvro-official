-- ============ Cart / multi-item orders ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_multi_item boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_url text,
  color_name text,
  size_name text,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;

-- Admin can read every order's items.
DROP POLICY IF EXISTS "order items admin read" ON public.order_items;
CREATE POLICY "order items admin read" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_zyvro_admin());

-- A signed-in customer can read the items of their own orders.
DROP POLICY IF EXISTS "order items customer read own" ON public.order_items;
CREATE POLICY "order items customer read own" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.customer_user_id = auth.uid())
  );

-- Items can be inserted alongside an order that belongs to the signed-in customer.
DROP POLICY IF EXISTS "order items insert with own order" ON public.order_items;
CREATE POLICY "order items insert with own order" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.customer_user_id = auth.uid())
  );
