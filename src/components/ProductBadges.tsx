import { LABEL_DISPLAY, type ProductLabel, type ProductRow } from "@/lib/products";
import { isNewArrival } from "@/lib/settings";

interface Props {
  product: Pick<ProductRow, "labels" | "sale_price" | "regular_price" | "status" | "created_at">;
  totalStock?: number;
  lowStockThreshold?: number;
  size?: "sm" | "md";
  max?: number;
  className?: string;
}

export function ProductBadges({
  product,
  totalStock,
  lowStockThreshold = 5,
  size = "sm",
  max = 3,
  className = "",
}: Props) {
  const badges: { key: string; label: string; tone: "gold" | "sale" | "warn" | "danger" | "info" | "soon" }[] = [];

  if (product.status === "coming_soon") {
    badges.push({ key: "soon", label: "Coming Soon", tone: "soon" });
  }

  const isSale = product.sale_price != null && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.regular_price);
  if (isSale) badges.push({ key: "sale", label: "Sale", tone: "sale" });

  const isNew = product.labels.includes("new_arrival") || isNewArrival(product.created_at);
  if (isNew) badges.push({ key: "new", label: "New", tone: "info" });

  for (const l of product.labels) {
    if (l === "new_arrival" || l === "sale") continue;
    if (badges.some((b) => b.key === l)) continue;
    badges.push({ key: l, label: LABEL_DISPLAY[l as ProductLabel] ?? l.replace(/_/g, " "), tone: "gold" });
  }

  if (typeof totalStock === "number" && product.status === "published") {
    if (totalStock <= 0) {
      badges.unshift({ key: "oos", label: "Out of Stock", tone: "danger" });
    } else if (totalStock <= lowStockThreshold) {
      badges.push({ key: "low", label: `Only ${totalStock} left`, tone: "warn" });
    }
  }

  const trimmed = badges.slice(0, max);
  if (trimmed.length === 0) return null;

  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {trimmed.map((b) => (
        <span
          key={b.key}
          className={`${px} tracked-wide uppercase font-medium backdrop-blur border ${toneClass(b.tone)}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

function toneClass(tone: "gold" | "sale" | "warn" | "danger" | "info" | "soon") {
  switch (tone) {
    case "sale":
      return "bg-[color:var(--gold)] text-black border-[color:var(--gold)]";
    case "danger":
      return "bg-red-500/90 text-white border-red-500";
    case "warn":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "info":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    case "soon":
      return "bg-black/60 text-[color:var(--gold-bright)] border-[color:var(--gold)]/40";
    case "gold":
    default:
      return "bg-black/50 text-[color:var(--gold-bright)] border-[color:var(--gold)]/40";
  }
}
