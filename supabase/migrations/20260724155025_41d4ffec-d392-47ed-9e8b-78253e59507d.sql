
-- Wipe old
DROP TABLE IF EXISTS public.products CASCADE;

-- Helper: updated_at trigger fn (reuse if exists)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Admin check helper (email based, matches existing policy pattern)
CREATE OR REPLACE FUNCTION public.is_zyvro_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.jwt() ->> 'email') = 'zyvro@official.com';
$$;

-- Enum: product status
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft','published','hidden','coming_soon');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TAXONOMY ============

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections public read" ON public.collections FOR SELECT USING (true);
CREATE POLICY "collections admin write" ON public.collections FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  hex text NOT NULL DEFAULT '#000000',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.colors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.colors TO authenticated;
GRANT ALL ON public.colors TO service_role;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colors public read" ON public.colors FOR SELECT USING (true);
CREATE POLICY "colors admin write" ON public.colors FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_colors_updated_at BEFORE UPDATE ON public.colors
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sizes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sizes TO authenticated;
GRANT ALL ON public.sizes TO service_role;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sizes public read" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "sizes admin write" ON public.sizes FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_sizes_updated_at BEFORE UPDATE ON public.sizes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PRODUCTS ============

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,                 -- rich text HTML
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  video_url text,
  status public.product_status NOT NULL DEFAULT 'draft',
  labels text[] NOT NULL DEFAULT '{}', -- e.g. new_arrival, best_seller, featured, trending, limited_edition, sale
  regular_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2),
  cost_price numeric(12,2),
  weight numeric(10,3),
  shipping_charge numeric(12,2),
  free_shipping boolean NOT NULL DEFAULT false,
  low_stock_threshold int NOT NULL DEFAULT 5,
  seo_title text,
  seo_description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_collection_idx ON public.products(collection_id);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read published" ON public.products FOR SELECT
  USING (status = 'published' OR public.is_zyvro_admin());
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Generic product images (not tied to a color)
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_images_product_idx ON public.product_images(product_id, sort_order);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_images public read" ON public.product_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.status = 'published' OR public.is_zyvro_admin())));
CREATE POLICY "product_images admin write" ON public.product_images FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());

-- Color variants
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES public.colors(id) ON DELETE RESTRICT,
  sku text,
  price_override numeric(12,2),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, color_id)
);
CREATE INDEX product_variants_product_idx ON public.product_variants(product_id, sort_order);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_variants public read" ON public.product_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.status = 'published' OR public.is_zyvro_admin())));
CREATE POLICY "product_variants admin write" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Images per color variant
CREATE TABLE public.product_variant_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variant_images_variant_idx ON public.product_variant_images(variant_id, sort_order);
GRANT SELECT ON public.product_variant_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variant_images TO authenticated;
GRANT ALL ON public.product_variant_images TO service_role;
ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_variant_images public read" ON public.product_variant_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
    WHERE v.id = variant_id AND (p.status = 'published' OR public.is_zyvro_admin())
  ));
CREATE POLICY "product_variant_images admin write" ON public.product_variant_images FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());

-- Sizes per variant (stock lives here)
CREATE TABLE public.product_variant_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES public.sizes(id) ON DELETE RESTRICT,
  stock int NOT NULL DEFAULT 0,
  sku text,
  price_override numeric(12,2),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, size_id)
);
CREATE INDEX pvs_variant_idx ON public.product_variant_sizes(variant_id, sort_order);
GRANT SELECT ON public.product_variant_sizes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variant_sizes TO authenticated;
GRANT ALL ON public.product_variant_sizes TO service_role;
ALTER TABLE public.product_variant_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pvs public read" ON public.product_variant_sizes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
    WHERE v.id = variant_id AND (p.status = 'published' OR public.is_zyvro_admin())
  ));
CREATE POLICY "pvs admin write" ON public.product_variant_sizes FOR ALL TO authenticated
  USING (public.is_zyvro_admin()) WITH CHECK (public.is_zyvro_admin());
CREATE TRIGGER tg_pvs_updated_at BEFORE UPDATE ON public.product_variant_sizes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Total stock helper
CREATE OR REPLACE FUNCTION public.product_total_stock(_product_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(pvs.stock), 0)::int
  FROM public.product_variant_sizes pvs
  JOIN public.product_variants v ON v.id = pvs.variant_id
  WHERE v.product_id = _product_id;
$$;
