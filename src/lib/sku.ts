import { DEFAULT_SETTINGS } from "./settings";

export function generateSKU(opts: {
  prefix?: string;
  categorySlug?: string | null;
  productSlug?: string | null;
  colorName?: string | null;
  sizeName?: string | null;
}): string {
  const parts = [
    opts.prefix || DEFAULT_SETTINGS.sku_prefix,
    (opts.categorySlug || "").slice(0, 3).toUpperCase(),
    (opts.productSlug || "").split("-").slice(0, 2).join("").slice(0, 5).toUpperCase(),
    (opts.colorName || "").replace(/\s+/g, "").slice(0, 3).toUpperCase(),
    (opts.sizeName || "").replace(/\s+/g, "").toUpperCase(),
  ].filter(Boolean);
  return parts.join("-");
}

export function shortHash(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
