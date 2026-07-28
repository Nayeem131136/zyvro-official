import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProductStatus = Database["public"]["Enums"]["product_status"];

export const PRODUCT_LABELS = [
  "new_arrival",
  "best_seller",
  "featured",
  "trending",
  "limited_edition",
  "sale",
] as const;
export type ProductLabel = (typeof PRODUCT_LABELS)[number];

export const LABEL_DISPLAY: Record<ProductLabel, string> = {
  new_arrival: "New Arrival",
  best_seller: "Best Seller",
  featured: "Featured",
  trending: "Trending",
  limited_edition: "Limited Edition",
  sale: "Sale",
};

export const STATUS_DISPLAY: Record<ProductStatus, string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Hidden",
  coming_soon: "Coming Soon",
};

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  collection_id: string | null;
  tags: string[];
  thumbnail_url: string | null;
  video_url: string | null;
  status: ProductStatus;
  labels: string[];
  regular_price: number;
  sale_price: number | null;
  cost_price: number | null;
  weight: number | null;
  shipping_charge: number | null;
  free_shipping: boolean;
  low_stock_threshold: number;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface VariantSize {
  id: string;
  variant_id: string;
  size_id: string;
  stock: number;
  sku: string | null;
  price_override: number | null;
  sort_order: number;
}

export interface VariantImage {
  id: string;
  variant_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color_id: string;
  sku: string | null;
  price_override: number | null;
  sort_order: number;
  images: VariantImage[];
  sizes: VariantSize[];
}

export interface ProductWithVariants extends ProductRow {
  images: ProductImage[];
  variants: ProductVariant[];
  total_stock?: number;
}

/** Product row + aggregated total stock (for cards). */
export interface ProductCardRow extends ProductRow {
  total_stock: number;
}

export function effectivePrice(p: Pick<ProductRow, "regular_price" | "sale_price">): number {
  return p.sale_price != null && p.sale_price > 0 ? Number(p.sale_price) : Number(p.regular_price);
}

export function discountPercent(p: Pick<ProductRow, "regular_price" | "sale_price">): number | null {
  const reg = Number(p.regular_price);
  const sale = p.sale_price != null ? Number(p.sale_price) : null;
  if (!sale || !reg || sale >= reg) return null;
  return Math.round(((reg - sale) / reg) * 100);
}

export function totalStock(p: ProductWithVariants): number {
  return p.variants.reduce((s, v) => s + v.sizes.reduce((ss, sz) => ss + (sz.stock || 0), 0), 0);
}

/** Lightweight fetch: products with nested variant sizes for total_stock aggregation. */
export async function fetchPublishedProducts(): Promise<ProductCardRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(product_variant_sizes(stock))")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Raw = ProductRow & {
    product_variants: { product_variant_sizes: { stock: number }[] }[];
  };
  return (data as unknown as Raw[] ?? []).map((p) => {
    const total = (p.product_variants ?? []).reduce(
      (s, v) => s + (v.product_variant_sizes ?? []).reduce((ss, sz) => ss + (sz.stock || 0), 0),
      0,
    );
    const { product_variants: _pv, ...rest } = p;
    return { ...rest, total_stock: total };
  });
}

/** For homepage sections: filter by label + status. */
export async function fetchProductsByLabel(label: string, limit = 8): Promise<ProductCardRow[]> {
  const all = await fetchPublishedProducts();
  return all.filter((p) => p.labels.includes(label)).slice(0, limit);
}

/** Coming Soon list (any status = coming_soon). */
export async function fetchComingSoon(limit = 8): Promise<ProductCardRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(product_variant_sizes(stock))")
    .eq("status", "coming_soon")
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  type Raw = ProductRow & {
    product_variants: { product_variant_sizes: { stock: number }[] }[];
  };
  return (data as unknown as Raw[] ?? []).map((p) => {
    const total = (p.product_variants ?? []).reduce(
      (s, v) => s + (v.product_variant_sizes ?? []).reduce((ss, sz) => ss + (sz.stock || 0), 0),
      0,
    );
    const { product_variants: _pv, ...rest } = p;
    return { ...rest, total_stock: total };
  });
}

export async function fetchAllProductsAdmin(): Promise<ProductCardRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(product_variant_sizes(stock))")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Raw = ProductRow & {
    product_variants: { product_variant_sizes: { stock: number }[] }[];
  };
  return (data as unknown as Raw[] ?? []).map((p) => {
    const total = (p.product_variants ?? []).reduce(
      (s, v) => s + (v.product_variant_sizes ?? []).reduce((ss, sz) => ss + (sz.stock || 0), 0),
      0,
    );
    const { product_variants: _pv, ...rest } = p;
    return { ...rest, total_stock: total };
  });
}

async function hydrateProduct(product: ProductRow): Promise<ProductWithVariants> {
  const [imagesRes, variantsRes] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", product.id).order("sort_order"),
  ]);
  if (imagesRes.error) throw imagesRes.error;
  if (variantsRes.error) throw variantsRes.error;
  const variantIds = (variantsRes.data ?? []).map((v) => v.id);
  const [vImgRes, vSizeRes] = await Promise.all([
    variantIds.length
      ? supabase.from("product_variant_images").select("*").in("variant_id", variantIds).order("sort_order")
      : Promise.resolve({ data: [], error: null } as const),
    variantIds.length
      ? supabase.from("product_variant_sizes").select("*").in("variant_id", variantIds).order("sort_order")
      : Promise.resolve({ data: [], error: null } as const),
  ]);
  if (vImgRes.error) throw vImgRes.error;
  if (vSizeRes.error) throw vSizeRes.error;
  const variants: ProductVariant[] = (variantsRes.data ?? []).map((v) => ({
    ...v,
    images: (vImgRes.data ?? []).filter((i) => i.variant_id === v.id),
    sizes: (vSizeRes.data ?? []).filter((s) => s.variant_id === v.id),
  }));
  const full: ProductWithVariants = {
    ...product,
    images: imagesRes.data ?? [],
    variants,
  };
  full.total_stock = totalStock(full);
  return full;
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return hydrateProduct(data);
}

export async function fetchProductByIdFull(id: string): Promise<ProductWithVariants | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return hydrateProduct(data);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Stock status shorthand */
export type StockState = "in_stock" | "low_stock" | "out_of_stock";
export function stockState(total: number, threshold: number): StockState {
  if (total <= 0) return "out_of_stock";
  if (total <= threshold) return "low_stock";
  return "in_stock";
}
