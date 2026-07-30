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
