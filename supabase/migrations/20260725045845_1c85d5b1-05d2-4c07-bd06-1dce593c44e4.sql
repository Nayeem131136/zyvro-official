
-- ============ app_settings (key/value) ============
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role, authenticated;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings public read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings admin write" ON public.app_settings FOR ALL TO authenticated USING (is_zyvro_admin()) WITH CHECK (is_zyvro_admin());

INSERT INTO public.app_settings (key, value) VALUES
  ('brand_name', '"ZYVRO"'::jsonb),
  ('sku_prefix', '"ZYV"'::jsonb),
  ('new_arrival_days', '30'::jsonb),
  ('currency_symbol', '"৳"'::jsonb),
  ('low_stock_default', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============ size_guides ============
CREATE TABLE public.size_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  content_html text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.size_guides TO anon, authenticated;
GRANT ALL ON public.size_guides TO service_role, authenticated;
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "size_guides public read" ON public.size_guides FOR SELECT USING (true);
CREATE POLICY "size_guides admin write" ON public.size_guides FOR ALL TO authenticated USING (is_zyvro_admin()) WITH CHECK (is_zyvro_admin());
CREATE TRIGGER trg_size_guides_updated_at BEFORE UPDATE ON public.size_guides
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ product_notifications ============
CREATE TABLE public.product_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email text NOT NULL,
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, email)
);
GRANT INSERT ON public.product_notifications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.product_notifications TO authenticated;
GRANT ALL ON public.product_notifications TO service_role;
ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications public insert" ON public.product_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications admin read" ON public.product_notifications FOR SELECT TO authenticated USING (is_zyvro_admin());
CREATE POLICY "notifications admin write" ON public.product_notifications FOR UPDATE TO authenticated USING (is_zyvro_admin()) WITH CHECK (is_zyvro_admin());
CREATE POLICY "notifications admin delete" ON public.product_notifications FOR DELETE TO authenticated USING (is_zyvro_admin());

-- ============ Missing update triggers ============
DO $$ BEGIN
  CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_colors_updated_at BEFORE UPDATE ON public.colors
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_sizes_updated_at BEFORE UPDATE ON public.sizes
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.tg_products_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_pvs_updated_at BEFORE UPDATE ON public.product_variant_sizes
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Indexes ============
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_slug ON public.products(slug);
CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_slug ON public.categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS ux_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS ix_products_status_sort ON public.products(status, sort_order);
CREATE INDEX IF NOT EXISTS ix_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS ix_products_collection ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS ix_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_products_labels ON public.products USING GIN(labels);
CREATE INDEX IF NOT EXISTS ix_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS ix_product_images_prod ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS ix_product_variants_prod ON public.product_variants(product_id, sort_order);
CREATE INDEX IF NOT EXISTS ix_pvi_variant ON public.product_variant_images(variant_id, sort_order);
CREATE INDEX IF NOT EXISTS ix_pvs_variant ON public.product_variant_sizes(variant_id);
CREATE INDEX IF NOT EXISTS ix_notifications_product ON public.product_notifications(product_id);
CREATE INDEX IF NOT EXISTS ix_size_guides_category ON public.size_guides(category_id, sort_order);

-- ============ Helper: is_new_arrival ============
CREATE OR REPLACE FUNCTION public.is_new_arrival(_created_at timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT _created_at > now() - (
    COALESCE((SELECT (value)::text::int FROM public.app_settings WHERE key = 'new_arrival_days'), 30)
    || ' days')::interval;
$$;
