import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { fetchProductsByLabel } from "@/lib/products";

export function AutoSection({
  label,
  title,
  eyebrow,
  limit = 4,
  fallbackHide = true,
  excludeIds,
  onShown,
}: {
  label: string;
  title: string;
  eyebrow?: string;
  limit?: number;
  fallbackHide?: boolean;
  /** Product IDs already shown earlier on the page — filtered out here so
   * the same product never repeats across multiple label sections. */
  excludeIds?: Set<string>;
  /** Reports the IDs this section ends up displaying, so later sections
   * can exclude them too. */
  onShown?: (ids: string[]) => void;
}) {
  // Fetch extra so we still have enough left after excluding already-shown items.
  const { data, isLoading } = useQuery({
    queryKey: ["products", "by-label", label, limit],
    queryFn: () => fetchProductsByLabel(label, limit + (excludeIds?.size ?? 0)),
  });
  const items = (data ?? []).filter((p) => !excludeIds?.has(p.id)).slice(0, limit);

  const reportedRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !reportedRef.current) {
      reportedRef.current = true;
      onShown?.(items.map((p) => p.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
