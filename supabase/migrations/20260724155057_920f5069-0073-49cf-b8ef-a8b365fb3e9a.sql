
CREATE OR REPLACE FUNCTION public.is_zyvro_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT (auth.jwt() ->> 'email') = 'zyvro@official.com';
$$;

CREATE OR REPLACE FUNCTION public.product_total_stock(_product_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(SUM(pvs.stock), 0)::int
  FROM public.product_variant_sizes pvs
  JOIN public.product_variants v ON v.id = pvs.variant_id
  WHERE v.product_id = _product_id;
$$;
