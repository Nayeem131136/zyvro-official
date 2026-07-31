-- Orders now require the customer to be signed in (no more guest checkout),
-- so every order can be tracked in "My Orders".
DROP POLICY IF EXISTS "orders public insert" ON public.orders;
CREATE POLICY "orders public insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND customer_user_id = auth.uid());
