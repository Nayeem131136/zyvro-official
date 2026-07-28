import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, Shirt, Gem, Globe2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Marquee } from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { AutoSection } from "@/components/AutoSection";
import { fetchPublishedProducts } from "@/lib/products";

import heroBannerAsset from "@/assets/zyvro-hero-banner.png.asset.json";
import heroAsset from "@/assets/zyvro-hero.png.asset.json";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const features = [
  { icon: Award, label: "Premium Quality" },
  { icon: Shirt, label: "Oversized Comfort" },
  { icon: Gem, label: "Limited Edition" },
  { icon: Globe2, label: "Made for the Culture" },
];

function HomePage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "published"],
    queryFn: fetchPublishedProducts,
  });

  const featured = (products ?? []).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative w-full bg-background">
        <img
          src={heroBannerAsset.url}
          alt="ZYVRO — Built Different. Premium streetwear banner."
          className="w-full h-auto max-w-full object-contain"
          width={960}
          height={384}
        />
      </section>

      <Marquee />

      <section className="py-20 md:py-24 border-y border-[#E8C878]/15 bg-[oklch(0.085_0_0)]">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          {features.map((f) => (
            <div key={f.label} className="flex flex-col items-center text-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-[#E8C878]/40 bg-[rgba(232,200,120,0.12)] shadow-[0_0_24px_rgba(232,200,120,0.08)]">
                <f.icon className="h-7 w-7 text-[#E8C878] drop-shadow-[0_0_8px_rgba(232,200,120,0.45)]" strokeWidth={2} />
              </div>
              <div className="font-display text-xs md:text-sm tracked-wide text-foreground">{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
              <div>
                <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-2">LATEST DROPS</div>
                <h2 className="font-display text-4xl md:text-5xl">Featured Collection</h2>
              </div>
              <Link to="/shop" className="btn-zy-outline !py-3 !text-xs">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="border border-dashed border-white/10 py-24 text-center">
              <p className="text-muted-foreground tracked-wide text-sm">
                No drops available yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <ProductCard product={p} totalStock={p.total_stock} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <AutoSection label="new_arrival" title="New Arrivals" eyebrow="JUST DROPPED" />
      <AutoSection label="best_seller" title="Best Sellers" eyebrow="TOP OF THE DROP" />
      <AutoSection label="limited_edition" title="Limited Edition" eyebrow="LIMITED RUN" />
      <AutoSection label="sale" title="On Sale" eyebrow="LAST CALL" />

      <section className="py-20 md:py-28 border-t border-white/5 bg-[oklch(0.09_0_0)]">
        <div className="mx-auto max-w-7xl px-6 grid gap-12 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="space-y-6">
              <div className="text-xs tracked-wide text-[color:var(--gold-bright)]">OUR PHILOSOPHY</div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight">
                We don't follow trends.<br />
                <span className="gold-gradient-text">We create them.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ZYVRO is not just a t-shirt brand. Every piece is engineered around a single
                philosophy — <em className="not-italic text-foreground">Own Your Style</em>.
                Oversized drop-shoulder silhouettes, premium fabric, and design that speaks
                without shouting.
              </p>
              <Link to="/about" className="btn-zy-outline !py-3 !text-xs">
                Read Our Story
              </Link>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="relative aspect-[4/5] border border-white/10 overflow-hidden">
              <img src={heroAsset.url} alt="ZYVRO philosophy" className="h-full w-full object-cover object-right" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/70 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="font-display text-3xl gold-gradient-text">Own Your Style.</div>
                <div className="gold-hairline w-24 mt-3" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-32 md:py-48 relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 text-center relative">
          <Reveal>
            <div className="text-xs tracked-wide text-muted-foreground mb-6">— A STATEMENT —</div>
          </Reveal>
          <Reveal delay={200}>
            <h2 className="font-display text-6xl sm:text-8xl md:text-9xl leading-[0.9]">
              <span className="block text-foreground/20">NOT FOR</span>
              <span className="block gold-gradient-text">EVERYONE.</span>
            </h2>
          </Reveal>
          <Reveal delay={500}>
            <p className="mt-10 max-w-xl mx-auto text-sm text-muted-foreground tracked-wide">
              Made for those who move differently. If it's not you — it's not for you.
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
