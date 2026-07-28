
DROP POLICY IF EXISTS "notifications public insert" ON public.product_notifications;
CREATE POLICY "notifications public insert"
  ON public.product_notifications
  FOR INSERT
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 254
    AND notified = false
    AND notified_at IS NULL
    AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id)
  );
