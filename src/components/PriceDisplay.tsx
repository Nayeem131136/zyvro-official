import { discountPercent } from "@/lib/products";
import { formatPrice } from "@/lib/settings";

export function PriceDisplay({
  price,
  regular,
  size = "md",
  showDiscountPct = false,
}: {
  price: number;
  regular?: number | null;
  size?: "sm" | "md" | "lg";
  showDiscountPct?: boolean;
}) {
  const showStrike = regular != null && regular > price;
  const cls =
    size === "sm" ? "text-base" : size === "lg" ? "text-3xl md:text-4xl" : "text-lg";
  const strike = size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-xs";
  const disc = showStrike && showDiscountPct
    ? discountPercent({ regular_price: regular ?? 0, sale_price: price })
    : null;
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`font-display gold-gradient-text ${cls}`}>{formatPrice(price)}</span>
      {showStrike && (
        <span className={`text-muted-foreground line-through ${strike}`}>{formatPrice(regular!)}</span>
      )}
      {disc != null && (
        <span className="text-[10px] tracked-wide font-medium text-emerald-400 uppercase">−{disc}%</span>
      )}
    </div>
  );
}
