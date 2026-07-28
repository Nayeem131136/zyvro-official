import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, ArrowLeft, Share2, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductBadges } from "@/components/ProductBadges";
import { PriceDisplay } from "@/components/PriceDisplay";
import { SizeGuideButton } from "@/components/SizeGuideButton";
import { NotifyMeModal } from "@/components/NotifyMeModal";
import {
  fetchProductBySlug,
  fetchPublishedProducts,
  effectivePrice,
  totalStock,
  type ProductVariant,
  type VariantSize,
  type ProductWithVariants,
} from "@/lib/products";
import { fetchColors, fetchSizes } from "@/lib/taxonomy";
import { whatsappOrderUrl } from "@/lib/config";
import { formatPrice } from "@/lib/settings";
import { SITE_URL, abs } from "@/lib/site";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  loader: async ({ params }) => {
    const p = await fetchProductBySlug(params.slug);
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product · ZYVRO" }] };
    const url = `${SITE_URL}/product/${params.slug}`;
    const title = p.seo_title || `${p.name} · ZYVRO`;
    const desc =
      p.seo_description ||
      p.short_description ||
      `${p.name} — premium oversized streetwear by ZYVRO. Own Your Style.`;
    const image = abs(p.thumbnail_url || p.images[0]?.url || "");
    const price = effectivePrice(p);
    const inStock = (p.total_stock ?? totalStock(p)) > 0 && p.status === "published";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: desc,
      image: [image],
      sku: p.variants[0]?.sku || undefined,
      brand: { "@type": "Brand", name: "ZYVRO" },
      offers: {
        "@type": "Offer",
        url,
        price: price.toString(),
        priceCurrency: "BDT",
        availability: inStock
          ? "https://schema.org/InStock"
          : p.status === "coming_soon"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/OutOfStock",
      },
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "product:price:amount", content: price.toString() },
        { property: "product:price:currency", content: "BDT" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(jsonLd) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-40 pb-32 text-center px-6">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link to="/shop" className="btn-zy-outline mt-8 inline-flex">Back to shop</Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-40 pb-32 text-center px-6">
        <h1 className="font-display text-3xl">Couldn't load this product.</h1>
        <Link to="/shop" className="btn-zy-outline mt-8 inline-flex">Back to shop</Link>
      </div>
      <Footer />
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { product } = Route.useLoaderData() as { product: ProductWithVariants };
  const { data: allProducts } = useQuery({
    queryKey: ["products", "published"],
    queryFn: fetchPublishedProducts,
  });
  const { data: colors = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors });
  const { data: sizes = [] } = useQuery({ queryKey: ["sizes"], queryFn: fetchSizes });

  const colorMap = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const sizeMap = useMemo(() => new Map(sizes.map((s) => [s.id, s])), [sizes]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [notifyOpen, setNotifyOpen] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedSizeId(null);
  }, [selectedVariantId, slug]);

  const selectedVariant: ProductVariant | null =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0] ?? null;

  const galleryImages =
    selectedVariant && selectedVariant.images.length > 0
      ? selectedVariant.images.map((i) => i.url)
      : product.images.length > 0
      ? product.images.map((i) => i.url)
      : product.thumbnail_url
      ? [product.thumbnail_url]
      : [];

  const activeImage = galleryImages[activeImageIdx] ?? galleryImages[0];

  const selectedSize: VariantSize | null =
    selectedVariant?.sizes.find((s) => s.id === selectedSizeId) ?? null;

  const priceBase =
    selectedSize?.price_override != null
      ? Number(selectedSize.price_override)
      : selectedVariant?.price_override != null
      ? Number(selectedVariant.price_override)
      : effectivePrice(product);

  const stockTotal = product.total_stock ?? totalStock(product);
  const isComingSoon = product.status === "coming_soon";
  const isOOS = !isComingSoon && stockTotal <= 0;
  const canOrder =
    !isComingSoon &&
    !isOOS &&
    (!!selectedVariant && (selectedVariant.sizes.length === 0 || !!selectedSize));

  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const related = (allProducts ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  const orderText = selectedVariant
    ? `${product.name} — ${colorMap.get(selectedVariant.color_id)?.name ?? "Color"}${
        selectedSize ? ` / ${sizeMap.get(selectedSize.size_id)?.name}` : ""
      }`
    : product.name;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: productUrl });
      } else {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied");
      }
    } catch { /* cancelled */ }
  }

  function nav(dir: 1 | -1) {
    if (galleryImages.length < 2) return;
    setActiveImageIdx((i) => (i + dir + galleryImages.length) % galleryImages.length);
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="pt-24 md:pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs tracked-wide text-muted-foreground hover:text-[color:var(--gold-bright)] mb-6">
            <ArrowLeft className="h-3 w-3" /> BACK TO SHOP
          </Link>

          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            {/* Gallery */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-[4/5] border border-white/10 overflow-hidden bg-[oklch(0.1_0_0)] group">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={`${product.name} — image ${activeImageIdx + 1}`}
                    width={800}
                    height={1000}
                    className="h-full w-full object-cover transition-opacity duration-300"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground text-xs tracked-wide">
                    NO IMAGE
                  </div>
                )}
                <div className="absolute left-3 top-3 right-3">
                  <ProductBadges
                    product={product}
                    totalStock={stockTotal}
                    lowStockThreshold={product.low_stock_threshold}
                    max={3}
                    size="md"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => nav(-1)}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center bg-black/50 backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => nav(1)}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center bg-black/50 backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {galleryImages.map((url, i) => (
                    <button
                      key={url + i}
                      onClick={() => setActiveImageIdx(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`aspect-square border overflow-hidden bg-white/5 transition ${
                        i === activeImageIdx ? "border-[color:var(--gold)]" : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <img src={url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-6 md:pl-6">
              <div>
                {product.short_description && (
                  <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-3 uppercase">
                    {product.short_description}
                  </div>
                )}
                <h1 className="font-display text-4xl md:text-6xl leading-tight">{product.name}</h1>
              </div>

              <PriceDisplay price={priceBase} regular={product.regular_price} size="lg" showDiscountPct />

              <div className="gold-hairline w-full" />

              {/* Color selector */}
              {product.variants.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs tracked-wide text-muted-foreground">
                    COLOR: <span className="text-foreground">{selectedVariant ? colorMap.get(selectedVariant.color_id)?.name : ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v) => {
                      const color = colorMap.get(v.color_id);
                      const active = v.id === selectedVariantId;
                      const totalStk = v.sizes.reduce((sum, s) => sum + s.stock, 0);
                      const oos = totalStk <= 0;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          title={`${color?.name ?? ""}${oos ? " (Out of stock)" : ""}`}
                          aria-label={`Select ${color?.name ?? "color"}`}
                          className={`relative h-11 w-11 rounded-full border-2 transition ${
                            active ? "border-[color:var(--gold)] ring-2 ring-[color:var(--gold)]/30" : "border-white/20 hover:border-white/50"
                          }`}
                          style={{ backgroundColor: color?.hex ?? "#333" }}
                        >
                          {oos && <span className="absolute inset-0 grid place-items-center text-[10px] text-white bg-black/60 rounded-full">✕</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size selector + guide */}
              {selectedVariant && selectedVariant.sizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs tracked-wide text-muted-foreground">
                      SIZE: <span className="text-foreground">{selectedSize ? sizeMap.get(selectedSize.size_id)?.name : "Select"}</span>
                    </div>
                    <SizeGuideButton categoryId={product.category_id} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVariant.sizes
                      .slice()
                      .sort((a, b) => (sizeMap.get(a.size_id)?.sort_order ?? 0) - (sizeMap.get(b.size_id)?.sort_order ?? 0))
                      .map((s) => {
                        const size = sizeMap.get(s.size_id);
                        const oos = s.stock <= 0;
                        const active = s.id === selectedSizeId;
                        return (
                          <button
                            key={s.id}
                            disabled={oos}
                            onClick={() => setSelectedSizeId(s.id)}
                            className={`min-w-[3.25rem] px-4 py-3 text-xs tracked-wide border transition ${
                              active
                                ? "bg-[color:var(--gold)] text-black border-[color:var(--gold)]"
                                : oos
                                ? "border-white/5 text-muted-foreground/40 line-through cursor-not-allowed"
                                : "border-white/10 hover:border-[color:var(--gold)]/60"
                            }`}
                          >
                            {size?.name ?? "?"}
                          </button>
                        );
                      })}
                  </div>
                  {selectedSize && selectedSize.stock > 0 && selectedSize.stock <= product.low_stock_threshold && (
                    <p className="text-xs text-amber-400 tracked-wide">
                      Only {selectedSize.stock} left in stock
                    </p>
                  )}
                </div>
              )}

              {/* Actions — desktop / inline */}
              <div className="hidden md:flex gap-2">
                {isComingSoon ? (
                  <button
                    onClick={() => setNotifyOpen(true)}
                    className="btn-zy flex-1 !py-4"
                  >
                    <Bell className="h-5 w-5" /> Notify Me
                  </button>
                ) : isOOS ? (
                  <button
                    onClick={() => setNotifyOpen(true)}
                    className="btn-zy-outline flex-1 !py-4"
                  >
                    <Bell className="h-5 w-5" /> Notify When Available
                  </button>
                ) : (
                  <a
                    href={whatsappOrderUrl({ productName: orderText, price: priceBase, productUrl })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!canOrder) {
                        e.preventDefault();
                        toast.error("Please select a size first");
                      }
                    }}
                    className={`btn-zy flex-1 !py-4 ${!canOrder ? "opacity-60" : ""}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Order on WhatsApp
                  </a>
                )}
                <button onClick={share} className="btn-zy-outline !py-4 !px-4" aria-label="Share">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {product.free_shipping && (
                <p className="text-xs text-emerald-400 tracked-wide">✓ FREE SHIPPING</p>
              )}

              {product.description && (
                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-xs tracked-wide text-muted-foreground mb-3">DESCRIPTION</h3>
                  <div
                    className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-20 md:mt-24">
              <div className="mb-8 flex items-end justify-between">
                <h2 className="font-display text-2xl md:text-3xl">You May Also Like</h2>
                <div className="gold-hairline flex-1 ml-8 mb-3" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} totalStock={p.total_stock} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-background/95 backdrop-blur px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)] flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-muted-foreground tracked-wide truncate">{product.name}</div>
          <div className="font-display text-lg gold-gradient-text">{formatPrice(priceBase)}</div>
        </div>
        {isComingSoon || isOOS ? (
          <button
            onClick={() => setNotifyOpen(true)}
            className="btn-zy !py-3 !text-xs shrink-0"
          >
            <Bell className="h-4 w-4" /> Notify Me
          </button>
        ) : (
          <a
            href={whatsappOrderUrl({ productName: orderText, price: priceBase, productUrl })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!canOrder) {
                e.preventDefault();
                toast.error("Please select a size first");
              }
            }}
            className={`btn-zy !py-3 !text-xs shrink-0 ${!canOrder ? "opacity-60" : ""}`}
          >
            <MessageCircle className="h-4 w-4" /> Order
          </a>
        )}
      </div>

      <NotifyMeModal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        productId={product.id}
        productName={product.name}
      />

      <Footer />
    </div>
  );
}
