import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/lib/products";
import { effectivePrice } from "@/lib/products";
import { ProductBadges } from "./ProductBadges";
import { PriceDisplay } from "./PriceDisplay";

export function ProductCard({
  product,
  totalStock,
}: {
  product: ProductRow;
  totalStock?: number;
}) {
  const price = effectivePrice(product);
  const oos = typeof totalStock === "number" && totalStock <= 0 && product.status === "published";

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="zy-card group flex flex-col border border-white/10 bg-card overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--gold)]"
      aria-label={`View ${product.name}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[oklch(0.1_0_0)]">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={480}
            height={600}
            className={`zy-card-image absolute inset-0 h-full w-full object-cover transition-transform duration-700 ${
              oos ? "grayscale-[0.4] opacity-80" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-xs tracked-wide">
            NO IMAGE
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 right-3 pointer-events-none">
          <ProductBadges
            product={product}
            totalStock={totalStock}
            lowStockThreshold={product.low_stock_threshold}
            max={2}
          />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 min-w-0">
        <h3 className="font-display text-base sm:text-lg tracked-wide truncate group-hover:text-[color:var(--gold-bright)] transition-colors">
          {product.name}
        </h3>
        <PriceDisplay price={price} regular={product.regular_price} size="sm" />
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-white/10 bg-card overflow-hidden">
      <div className="aspect-[4/5] bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/5 animate-pulse" />
        <div className="h-4 w-1/3 bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
