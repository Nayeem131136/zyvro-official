import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { fetchPublishedProducts, effectivePrice } from "@/lib/products";
import { fetchCategories } from "@/lib/taxonomy";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop · ZYVRO — Premium Oversized Streetwear" },
      { name: "description", content: "Browse ZYVRO's oversized drop-shoulder tees. Premium quality, limited edition drops." },
      { property: "og:title", content: "Shop ZYVRO" },
      { property: "og:description", content: "Oversized drop-shoulder tees. Limited drops." },
    ],
  }),
});

function ShopPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "published"],
    queryFn: fetchPublishedProducts,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "low" | "high">("new");

  const products = data ?? [];
  const filtered = useMemo(() => {
    let out = categoryId === "all" ? products : products.filter((p) => p.category_id === categoryId);
    if (sort === "low") out = [...out].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sort === "high") out = [...out].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    return out;
  }, [products, categoryId, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 md:pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-3">THE COLLECTION</div>
            <h1 className="font-display text-5xl md:text-7xl">Shop ZYVRO</h1>
            <div className="gold-hairline w-24 mx-auto mt-6" />
          </div>

          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-white/5 py-4">
            <div className="flex flex-wrap gap-2">
              <FilterBtn active={categoryId === "all"} onClick={() => setCategoryId("all")}>All</FilterBtn>
              {categories.map((c) => (
                <FilterBtn key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                  {c.name}
                </FilterBtn>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "new" | "low" | "high")}
              className="bg-transparent border border-white/10 px-3 py-2 text-xs tracked-wide focus:border-[color:var(--gold)]/50 outline-none"
            >
              <option value="new">Newest</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-white/10 py-24 text-center">
              <p className="text-muted-foreground tracked-wide text-sm">No products yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs tracked-wide border transition ${
        active
          ? "bg-[color:var(--gold)] text-black border-[color:var(--gold)]"
          : "border-white/10 text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-[color:var(--gold-bright)]"
      }`}
    >
      {children}
    </button>
  );
}
