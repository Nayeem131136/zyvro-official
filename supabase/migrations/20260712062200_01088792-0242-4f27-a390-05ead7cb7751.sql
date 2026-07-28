
-- Products: switch admin gate from role-based to email-based (zyvro@official.com)
DROP POLICY IF EXISTS "Admins delete products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
DROP POLICY IF EXISTS "Admins view all products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admin views all products"
ON public.products FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'zyvro@official.com');

CREATE POLICY "Admin inserts products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'zyvro@official.com');

CREATE POLICY "Admin updates products"
ON public.products FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'zyvro@official.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'zyvro@official.com');

CREATE POLICY "Admin deletes products"
ON public.products FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'zyvro@official.com');

-- Grant anon SELECT for public browsing
GRANT SELECT ON public.products TO anon;

-- Storage policies for 'products' bucket
DROP POLICY IF EXISTS "Public read products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin update products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete products bucket" ON storage.objects;

CREATE POLICY "Public read products bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'products');

CREATE POLICY "Admin upload products bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products' AND (auth.jwt() ->> 'email') = 'zyvro@official.com');

CREATE POLICY "Admin update products bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND (auth.jwt() ->> 'email') = 'zyvro@official.com')
WITH CHECK (bucket_id = 'products' AND (auth.jwt() ->> 'email') = 'zyvro@official.com');

CREATE POLICY "Admin delete products bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND (auth.jwt() ->> 'email') = 'zyvro@official.com');
