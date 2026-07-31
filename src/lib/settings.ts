import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  brand_name: string;
  sku_prefix: string;
  new_arrival_days: number;
  currency_symbol: string;
  low_stock_default: number;
  whatsapp_number: string;
  delivery_charge_dhaka: number;
  delivery_charge_dhaka_sub: number;
  delivery_charge_outside_dhaka: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  brand_name: "ZYVRO",
  sku_prefix: "ZYV",
  new_arrival_days: 30,
  currency_symbol: "৳",
  low_stock_default: 5,
  whatsapp_number: "8801577142710",
  delivery_charge_dhaka: 80,
  delivery_charge_dhaka_sub: 100,
  delivery_charge_outside_dhaka: 130,
};

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from("app_settings").select("key,value");
  if (error) throw error;
  const out = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    const v = row.value as unknown;
    (out as Record<string, unknown>)[row.key] = v;
  }
  return out;
}

export async function upsertAppSetting(key: keyof AppSettings, value: unknown) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
}

export function formatPrice(v: number | string, symbol = DEFAULT_SETTINGS.currency_symbol) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return `${symbol}0`;
  return `${symbol}${n.toLocaleString()}`;
}

export function isNewArrival(createdAt: string | Date, days = DEFAULT_SETTINGS.new_arrival_days) {
  const t = typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  return Date.now() - t < days * 86400_000;
}

/**
 * "Product Defaults" — a reusable template so the admin doesn't have to
 * retype the same description/price/tags/etc. for every new product (e.g.
 * when every product is the same Drop Shoulder Tee at the same price).
 * Applies only to NEW products; editing an existing product always shows
 * its own saved values, never the template.
 */
export type ProductDefaults = {
  short_description: string;
  description: string;
  collection_id: string;
  tags: string;
  status: "draft" | "published" | "hidden" | "coming_soon";
  regular_price: string;
  sale_price: string;
  cost_price: string;
  weight: string;
  shipping_charge: string;
  free_shipping: boolean;
  low_stock_threshold: string;
  seo_title: string;
  seo_description: string;
};

export const BLANK_PRODUCT_DEFAULTS: ProductDefaults = {
  short_description: "",
  description: "",
  collection_id: "",
  tags: "",
  status: "draft",
  regular_price: "",
  sale_price: "",
  cost_price: "",
  weight: "",
  shipping_charge: "",
  free_shipping: false,
  low_stock_threshold: "5",
  seo_title: "",
  seo_description: "",
};

const PRODUCT_DEFAULTS_KEY = "product_defaults";

export async function fetchProductDefaults(): Promise<ProductDefaults | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", PRODUCT_DEFAULTS_KEY)
    .maybeSingle();
  if (error) throw error;
  return data?.value ? { ...BLANK_PRODUCT_DEFAULTS, ...(data.value as Partial<ProductDefaults>) } : null;
}

export async function saveProductDefaults(defaults: ProductDefaults) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: PRODUCT_DEFAULTS_KEY, value: defaults as never }, { onConflict: "key" });
  if (error) throw error;
}
