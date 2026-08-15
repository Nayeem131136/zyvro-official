-- ============ Spin & Win site-wide discount ============
CREATE TABLE IF NOT EXISTS public.spin_offers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  percent int NOT NULL,
  spun_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.spin_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spin offers read own" ON public.spin_offers;
CREATE POLICY "spin offers read own" ON public.spin_offers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "spin offers insert own" ON public.spin_offers;
CREATE POLICY "spin offers insert own" ON public.spin_offers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "spin offers update own" ON public.spin_offers;
CREATE POLICY "spin offers update own" ON public.spin_offers
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin can see all spins (useful for the dashboard later if wanted)
DROP POLICY IF EXISTS "spin offers admin read" ON public.spin_offers;
CREATE POLICY "spin offers admin read" ON public.spin_offers
  FOR SELECT TO authenticated USING (public.is_zyvro_admin());
