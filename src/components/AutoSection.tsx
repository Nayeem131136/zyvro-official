import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import type { ProductCardRow } from "@/lib/products";

/**
 * Purely presentational — the parent (Home page) decides exactly which
 * products go in this section (already deduplicated against every other
 * section) and passes them in directly. This avoids the race condition
 * that happens when every section independently fetches + self-excludes:
 * with only a couple of products sharing several labels, parallel fetches
 * could each "claim" the same product before hearing about each other.
 */
export function AutoSection({
  title,
  eyebrow,
  items,
  isLoading,
  limit = 4,
  fallbackHide = true,
}: {
  title: string;
  eyebrow?: string;
  items: ProductCardRow[];
  isLoading: boolean;
  limit?: number;
  fallbackHide?: boolean;
}) {
  if (!isLoading && items.length === 0 && fallbackHide) return null;

  return (
    <section className="py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
            <div>
              {eyebrow && (
                <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-2">
                  {eyebrow}
                </div>
              )}
              <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
            </div>
            <Link to="/shop" className="btn-zy-outline !py-3 !text-xs">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: limit }).map((_, i) => <ProductCardSkeleton key={i} />)
            : items.map((p, i) => (
                <Reveal key={p.id} delay={i * 70}>
                  <ProductCard product={p} totalStock={p.total_stock} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
