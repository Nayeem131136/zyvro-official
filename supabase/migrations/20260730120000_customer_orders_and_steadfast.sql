-- ============ Link orders to the signed-in customer (for "My Orders") ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_orders_customer_user_id ON public.orders(customer_user_id);

-- ============ Steadfast courier fields ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS steadfast_consignment_id text,
  ADD COLUMN IF NOT EXISTS steadfast_tracking_code text,
  ADD COLUMN IF NOT EXISTS steadfast_status text;

-- A signed-in customer may create an order tagged with their own user id,
-- or leave it null (guest checkout) — but never tag someone else's id.
DROP POLICY IF EXISTS "orders public insert" ON public.orders;
CREATE POLICY "orders public insert" ON public.orders
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND (customer_user_id IS NULL OR customer_user_id = auth.uid())
  );

-- A signed-in customer can read only their own orders.
DROP POLICY IF EXISTS "orders customer read own" ON public.orders;
CREATE POLICY "orders customer read own" ON public.orders
  FOR SELECT TO authenticated USING (customer_user_id = auth.uid());
