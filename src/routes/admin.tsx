import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllProductsAdmin,
  fetchProductByIdFull,
  slugify,
  PRODUCT_LABELS,
  LABEL_DISPLAY,
  STATUS_DISPLAY,
  type ProductRow,
  type ProductStatus,
  type ProductWithVariants,
  type ProductVariant,
  type VariantImage,
  type VariantSize,
} from "@/lib/products";
import {
  fetchCategories,
  fetchCollections,
  fetchColors,
  fetchSizes,
  type Category,
  type Collection,
  type Color,
  type Size,
} from "@/lib/taxonomy";
import { ADMIN_EMAIL, uploadProductImage, deleteProductImage } from "@/lib/admin";
import {
  fetchOrders,
  updateOrderStatus,
  subscribeOrders,
  buildWhatsappMessage,
  whatsappUrl,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { fetchAppSettings, upsertAppSetting, formatPrice, type AppSettings } from "@/lib/settings";
import { toast } from "sonner";
import {
  Loader2, LogOut, Pencil, Plus, Trash2, X, ExternalLink, Upload, Copy, Palette,
  Ruler, Tag, FolderOpen, Package, ChevronDown, ChevronUp, Image as ImageIcon,
  LayoutDashboard, ClipboardList, Settings, MessageCircle, Check, Ban,
} from "lucide-react";
import logoAsset from "@/assets/zyvro-logo.png";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin · ZYVRO" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type AuthState = "loading" | "unauth" | "ok";
type Tab = "dashboard" | "orders" | "products" | "collections" | "colors" | "sizes" | "settings";

function AdminPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? "";
      if (!mounted) return;
      setUserEmail(email);
      setState(email.toLowerCase() === ADMIN_EMAIL ? "ok" : "unauth");
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (state === "unauth") navigate({ to: "/admin/login" });
  }, [state, navigate]);

  async function signOut() {
    // scope: "local" clears the session immediately (no network round-trip),
    // so this resolves fast. We must await it BEFORE navigating, otherwise
    // /admin/login's own auth-check can still see the old session and bounce
    // straight back to /admin, causing a stuck/blank screen.
    await supabase.auth.signOut({ scope: "local" });
    navigate({ to: "/admin/login" });
  }

  if (state !== "ok") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" />
      </div>
    );
  }
  return <AdminDashboard email={userEmail} onSignOut={signOut} />;
}

function AdminDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ClipboardList },
    { id: "products", label: "Products", icon: Package },
    { id: "collections", label: "Collections", icon: Tag },
    { id: "colors", label: "Colors", icon: Palette },
    { id: "sizes", label: "Sizes", icon: Ruler },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 sticky top-0 bg-background/90 backdrop-blur z-20">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoAsset} alt="" className="h-8 w-8" />
            <div>
              <div className="font-display tracked-wide text-sm gold-gradient-text">ZYVRO ADMIN</div>
              <div className="text-[10px] text-muted-foreground">{email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs tracked-wide text-muted-foreground hover:text-foreground px-3 py-2 inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> View Site
            </Link>
            <button onClick={onSignOut} className="text-xs tracked-wide border border-white/10 px-3 py-2 hover:border-white/30 inline-flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-wrap gap-1 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-xs tracked-wide inline-flex items-center gap-2 border-b-2 transition -mb-px ${
                tab === t.id
                  ? "border-[color:var(--gold)] text-[color:var(--gold-bright)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "dashboard" && <DashboardTab onNavigate={setTab} />}
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "collections" && <TaxonomyTab kind="collections" />}
        {tab === "colors" && <TaxonomyTab kind="colors" />}
        {tab === "sizes" && <TaxonomyTab kind="sizes" />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

/* ============ PRODUCTS TAB ============ */

function ProductsTab() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: fetchAllProductsAdmin,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  const del = useMutation({
    mutationFn: async (p: ProductRow) => {
      // gather images to delete from storage
      const full = await fetchProductByIdFull(p.id);
      const urls: string[] = [];
      if (full?.thumbnail_url) urls.push(full.thumbnail_url);
      full?.images.forEach((i) => urls.push(i.url));
      full?.variants.forEach((v) => v.images.forEach((i) => urls.push(i.url)));
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      await Promise.all(urls.map((u) => deleteProductImage(u).catch(() => null)));
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products", "published"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: async (p: ProductRow) => {
      const full = await fetchProductByIdFull(p.id);
      if (!full) throw new Error("Not found");
      const newSlug = `${full.slug}-copy-${Date.now().toString(36)}`;
      const { data: newProd, error } = await supabase.from("products").insert({
        name: `${full.name} (Copy)`,
        slug: newSlug,
        short_description: full.short_description,
        description: full.description,
        category_id: full.category_id,
        collection_id: full.collection_id,
        tags: full.tags,
        thumbnail_url: full.thumbnail_url,
        video_url: full.video_url,
        status: "draft",
        labels: full.labels,
        regular_price: full.regular_price,
        sale_price: full.sale_price,
        cost_price: full.cost_price,
        weight: full.weight,
        shipping_charge: full.shipping_charge,
        free_shipping: full.free_shipping,
        low_stock_threshold: full.low_stock_threshold,
        seo_title: full.seo_title,
        seo_description: full.seo_description,
        sort_order: full.sort_order,
      }).select("*").single();
      if (error) throw error;
      // duplicate images
      if (full.images.length) {
        await supabase.from("product_images").insert(
          full.images.map((i) => ({ product_id: newProd.id, url: i.url, alt_text: i.alt_text, sort_order: i.sort_order })),
        );
      }
      // duplicate variants + sizes + images
      for (const v of full.variants) {
        const { data: nv, error: ve } = await supabase.from("product_variants").insert({
          product_id: newProd.id,
          color_id: v.color_id,
          sku: v.sku,
          price_override: v.price_override,
          sort_order: v.sort_order,
        }).select("id").single();
        if (ve) throw ve;
        if (v.images.length) {
          await supabase.from("product_variant_images").insert(
            v.images.map((i) => ({ variant_id: nv.id, url: i.url, alt_text: i.alt_text, sort_order: i.sort_order })),
          );
        }
        if (v.sizes.length) {
          await supabase.from("product_variant_sizes").insert(
            v.sizes.map((s) => ({ variant_id: nv.id, size_id: s.size_id, stock: s.stock, sku: s.sku, price_override: s.price_override, sort_order: s.sort_order })),
          );
        }
      }
      return newProd.id;
    },
    onSuccess: (id) => {
      toast.success("Duplicated");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setEditingId(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductStatus }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products", "published"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-xs text-muted-foreground mt-1">{products?.length ?? 0} total</p>
        </div>
        <button onClick={() => setEditingId("new")} className="btn-zy !py-3 !text-xs">
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="border border-white/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-white/[0.03] text-xs tracked-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-normal">Image</th>
              <th className="text-left px-4 py-3 font-normal">Name</th>
              <th className="text-left px-4 py-3 font-normal">Category</th>
              <th className="text-left px-4 py-3 font-normal">Price</th>
              <th className="text-left px-4 py-3 font-normal">Status</th>
              <th className="text-right px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">Loading…</td></tr>
            ) : (products?.length ?? 0) === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">No products yet. Create your first drop.</td></tr>
            ) : products!.map((p) => (
              <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="h-12 w-12 bg-white/5 overflow-hidden border border-white/5">
                    {p.thumbnail_url ? <img src={p.thumbnail_url} className="h-full w-full object-cover" alt="" /> : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-display tracked-wide">
                  {p.name}
                  <div className="text-[10px] text-muted-foreground font-sans">/{p.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.category_id ? categoryMap.get(p.category_id) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-[color:var(--gold-bright)]">
                  ৳{Number(p.sale_price ?? p.regular_price).toLocaleString()}
                  {p.sale_price != null && (
                    <span className="ml-2 text-[10px] text-muted-foreground line-through">
                      ৳{Number(p.regular_price).toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus.mutate({ id: p.id, status: e.target.value as ProductStatus })}
                    className={`bg-transparent border px-2 py-1 text-[10px] tracked-wide ${
                      p.status === "published" ? "border-emerald-500/40 text-emerald-400" :
                      p.status === "draft" ? "border-white/10 text-muted-foreground" :
                      p.status === "coming_soon" ? "border-[color:var(--gold)]/40 text-[color:var(--gold-bright)]" :
                      "border-white/10 text-muted-foreground"
                    }`}
                  >
                    {Object.entries(STATUS_DISPLAY).map(([k, v]) => <option key={k} value={k}>{v.toUpperCase()}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => setEditingId(p.id)} className="h-8 w-8 grid place-items-center border border-white/10 hover:border-[color:var(--gold)]/50 hover:text-[color:var(--gold-bright)]" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => duplicate.mutate(p)} className="h-8 w-8 grid place-items-center border border-white/10 hover:border-white/40" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm(`Delete "${p.name}"? This removes all variants and images.`)) del.mutate(p); }} className="h-8 w-8 grid place-items-center border border-white/10 hover:border-red-500/50 hover:text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <ProductEditor
          productId={editingId === "new" ? null : editingId}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}

/* ============ PRODUCT EDITOR ============ */

function ProductEditor({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isNew = productId == null;
  const { data: initial, isLoading } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => (productId ? fetchProductByIdFull(productId) : null),
    enabled: !!productId,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: collections = [] } = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const { data: colors = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors });
  const { data: sizes = [] } = useQuery({ queryKey: ["sizes"], queryFn: fetchSizes });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full grid place-items-start md:place-items-center p-4">
        <div className="w-full max-w-4xl bg-card border border-white/10 my-8 relative">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-card">
            <h2 className="font-display text-lg tracked-wide">{isNew ? "New Product" : "Edit Product"}</h2>
            <button type="button" onClick={onClose} className="h-8 w-8 grid place-items-center hover:bg-white/5"><X className="h-4 w-4" /></button>
          </div>
          {!isNew && isLoading ? (
            <div className="p-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" /></div>
          ) : (
            <EditorForm
              initial={initial ?? null}
              categories={categories}
              collections={collections}
              colors={colors}
              sizes={sizes}
              onSaved={(id) => {
                qc.invalidateQueries({ queryKey: ["admin", "products"] });
                qc.invalidateQueries({ queryKey: ["products", "published"] });
                qc.invalidateQueries({ queryKey: ["admin", "product", id] });
              }}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type EditorState = {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string;
  collection_id: string;
  tags: string;
  thumbnail_url: string;
  video_url: string;
  status: ProductStatus;
  labels: string[];
  regular_price: string;
  sale_price: string;
  cost_price: string;
  weight: string;
  shipping_charge: string;
  free_shipping: boolean;
  low_stock_threshold: string;
  seo_title: string;
  seo_description: string;
  images: { id?: string; url: string; sort_order: number }[];
  variants: EditorVariant[];
};

type EditorVariant = {
  id?: string;
  color_id: string;
  sku: string;
  price_override: string;
  sort_order: number;
  images: { id?: string; url: string; sort_order: number }[];
  sizes: { id?: string; size_id: string; stock: string; sku: string; price_override: string; sort_order: number }[];
  _open: boolean;
};

function initFromProduct(p: ProductWithVariants | null): EditorState {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    short_description: p?.short_description ?? "",
    description: p?.description ?? "",
    category_id: p?.category_id ?? "",
    collection_id: p?.collection_id ?? "",
    tags: (p?.tags ?? []).join(", "),
    thumbnail_url: p?.thumbnail_url ?? "",
    video_url: p?.video_url ?? "",
    status: p?.status ?? "draft",
    labels: p?.labels ?? [],
    regular_price: p ? String(p.regular_price) : "",
    sale_price: p?.sale_price != null ? String(p.sale_price) : "",
    cost_price: p?.cost_price != null ? String(p.cost_price) : "",
    weight: p?.weight != null ? String(p.weight) : "",
    shipping_charge: p?.shipping_charge != null ? String(p.shipping_charge) : "",
    free_shipping: p?.free_shipping ?? false,
    low_stock_threshold: p ? String(p.low_stock_threshold) : "5",
    seo_title: p?.seo_title ?? "",
    seo_description: p?.seo_description ?? "",
    images: (p?.images ?? []).map((i) => ({ id: i.id, url: i.url, sort_order: i.sort_order })),
    variants: (p?.variants ?? []).map((v, idx) => variantToEditor(v, idx === 0)),
  };
}

function variantToEditor(v: ProductVariant, open = false): EditorVariant {
  return {
    id: v.id,
    color_id: v.color_id,
    sku: v.sku ?? "",
    price_override: v.price_override != null ? String(v.price_override) : "",
    sort_order: v.sort_order,
    images: v.images.map((i: VariantImage) => ({ id: i.id, url: i.url, sort_order: i.sort_order })),
    sizes: v.sizes.map((s: VariantSize) => ({
      id: s.id, size_id: s.size_id, stock: String(s.stock),
      sku: s.sku ?? "", price_override: s.price_override != null ? String(s.price_override) : "",
      sort_order: s.sort_order,
    })),
    _open: open,
  };
}

function EditorForm({
  initial, categories, collections, colors, sizes, onSaved, onClose,
}: {
  initial: ProductWithVariants | null;
  categories: Category[]; collections: Collection[]; colors: Color[]; sizes: Size[];
  onSaved: (id: string) => void; onClose: () => void;
}) {
  const [s, setS] = useState<EditorState>(() => initFromProduct(initial));
  const [saving, setSaving] = useState(false);
  const [slugDirty, setSlugDirty] = useState(!!initial);

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function onNameChange(name: string) {
    setS((prev) => ({ ...prev, name, slug: slugDirty ? prev.slug : slugify(name) }));
  }

  async function uploadTo(target: "thumb" | "gallery" | { variantIdx: number }, files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    try {
      const uploaded = await Promise.all(arr.map((f) => uploadProductImage(f).then((r) => r.url)));
      setS((prev) => {
        if (target === "thumb") return { ...prev, thumbnail_url: uploaded[0] };
        if (target === "gallery") {
          const start = prev.images.length;
          return { ...prev, images: [...prev.images, ...uploaded.map((url, i) => ({ url, sort_order: start + i }))] };
        }
        const nvs = [...prev.variants];
        const v = nvs[target.variantIdx];
        const start = v.images.length;
        v.images = [...v.images, ...uploaded.map((url, i) => ({ url, sort_order: start + i }))];
        return { ...prev, variants: nvs };
      });
      toast.success(`Uploaded ${uploaded.length}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  function addVariant() {
    setS((prev) => ({
      ...prev,
      variants: [...prev.variants, {
        color_id: "", sku: "", price_override: "", sort_order: prev.variants.length,
        images: [], sizes: [], _open: true,
      }],
    }));
  }
  function removeVariant(idx: number) {
    setS((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  }
  function updateVariant(idx: number, patch: Partial<EditorVariant>) {
    setS((prev) => {
      const arr = [...prev.variants]; arr[idx] = { ...arr[idx], ...patch }; return { ...prev, variants: arr };
    });
  }
  function addSize(vIdx: number, sizeId: string) {
    setS((prev) => {
      const arr = [...prev.variants]; const v = arr[vIdx];
      if (v.sizes.some((sz) => sz.size_id === sizeId)) return prev;
      v.sizes = [...v.sizes, { size_id: sizeId, stock: "0", sku: "", price_override: "", sort_order: v.sizes.length }];
      return { ...prev, variants: arr };
    });
  }
  function updateSize(vIdx: number, sIdx: number, patch: Partial<EditorVariant["sizes"][number]>) {
    setS((prev) => {
      const arr = [...prev.variants]; const v = arr[vIdx];
      v.sizes = v.sizes.map((sz, i) => (i === sIdx ? { ...sz, ...patch } : sz));
      return { ...prev, variants: arr };
    });
  }
  function removeSize(vIdx: number, sIdx: number) {
    setS((prev) => {
      const arr = [...prev.variants]; const v = arr[vIdx];
      v.sizes = v.sizes.filter((_, i) => i !== sIdx);
      return { ...prev, variants: arr };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!s.name.trim()) throw new Error("Name is required");
      const slug = (s.slug || slugify(s.name)).trim();
      if (!slug) throw new Error("Slug required");
      if (!s.regular_price) throw new Error("Regular price required");

      const payload = {
        name: s.name.trim(),
        slug,
        short_description: s.short_description || null,
        description: s.description || null,
        category_id: s.category_id || categories[0]?.id || null,
        collection_id: s.collection_id || null,
        tags: s.tags.split(",").map((t) => t.trim()).filter(Boolean),
        thumbnail_url: s.thumbnail_url || null,
        video_url: s.video_url || null,
        status: s.status,
        labels: s.labels,
        regular_price: Number(s.regular_price),
        sale_price: s.sale_price ? Number(s.sale_price) : null,
        cost_price: s.cost_price ? Number(s.cost_price) : null,
        weight: s.weight ? Number(s.weight) : null,
        shipping_charge: s.shipping_charge ? Number(s.shipping_charge) : null,
        free_shipping: s.free_shipping,
        low_stock_threshold: s.low_stock_threshold ? Number(s.low_stock_threshold) : 5,
        seo_title: s.seo_title || null,
        seo_description: s.seo_description || null,
      };

      let productId: string;
      if (initial) {
        const { error } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (error) throw error;
        productId = initial.id;
        // wipe old images/variants and reinsert (simple + correct)
        await Promise.all([
          supabase.from("product_images").delete().eq("product_id", productId),
          supabase.from("product_variants").delete().eq("product_id", productId),
        ]);
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      if (s.images.length) {
        const { error } = await supabase.from("product_images").insert(
          s.images.map((i, idx) => ({ product_id: productId, url: i.url, sort_order: idx })),
        );
        if (error) throw error;
      }

      for (let vi = 0; vi < s.variants.length; vi++) {
        const v = s.variants[vi];
        if (!v.color_id) throw new Error(`Variant ${vi + 1}: color required`);
        const { data: nv, error: ve } = await supabase.from("product_variants").insert({
          product_id: productId,
          color_id: v.color_id,
          sku: v.sku || null,
          price_override: v.price_override ? Number(v.price_override) : null,
          sort_order: vi,
        }).select("id").single();
        if (ve) throw ve;
        if (v.images.length) {
          const { error } = await supabase.from("product_variant_images").insert(
            v.images.map((i, idx) => ({ variant_id: nv.id, url: i.url, sort_order: idx })),
          );
          if (error) throw error;
        }
        if (v.sizes.length) {
          const { error } = await supabase.from("product_variant_sizes").insert(
            v.sizes.map((sz, idx) => ({
              variant_id: nv.id,
              size_id: sz.size_id,
              stock: sz.stock ? Number(sz.stock) : 0,
              sku: sz.sku || null,
              price_override: sz.price_override ? Number(sz.price_override) : null,
              sort_order: idx,
            })),
          );
          if (error) throw error;
        }
      }

      toast.success(initial ? "Product updated" : "Product created");
      onSaved(productId);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="p-6 space-y-8">
      {/* Basics */}
      <Section title="Basics">
        <Field label="Name">
          <input required value={s.name} onChange={(e) => onNameChange(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL Slug">
            <input
              value={s.slug}
              onChange={(e) => { setSlugDirty(true); update("slug", slugify(e.target.value)); }}
              placeholder="oversized-tee-black"
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select value={s.status} onChange={(e) => update("status", e.target.value as ProductStatus)} className={inputCls}>
              {Object.entries(STATUS_DISPLAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Short Description">
          <input value={s.short_description} onChange={(e) => update("short_description", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Full Description (HTML supported)">
          <textarea rows={5} value={s.description} onChange={(e) => update("description", e.target.value)} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Collection">
            <select value={s.collection_id} onChange={(e) => update("collection_id", e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input value={s.tags} onChange={(e) => update("tags", e.target.value)} placeholder="oversized, streetwear, cotton" className={inputCls} />
        </Field>
        <Field label="Labels">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_LABELS.map((l) => {
              const active = s.labels.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => update("labels", active ? s.labels.filter((x) => x !== l) : [...s.labels, l])}
                  className={`px-3 py-1.5 text-[10px] tracked-wide uppercase border ${
                    active ? "bg-[color:var(--gold)] text-black border-[color:var(--gold)]" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {LABEL_DISPLAY[l]}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      {/* Media */}
      <Section title="Media">
        <Field label="Thumbnail Image">
          <div className="flex items-start gap-4">
            <div className="h-28 w-28 border border-white/10 overflow-hidden bg-white/5 shrink-0">
              {s.thumbnail_url ? <img src={s.thumbnail_url} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground">NO IMAGE</div>}
            </div>
            <div className="space-y-2">
              <UploadBtn label={s.thumbnail_url ? "Replace" : "Upload"} onFiles={(f) => uploadTo("thumb", f)} />
              {s.thumbnail_url && (
                <button type="button" onClick={() => update("thumbnail_url", "")} className="block text-[10px] tracked-wide text-red-400">REMOVE</button>
              )}
            </div>
          </div>
        </Field>

        <Field label="Gallery (unlimited)">
          <div className="space-y-3">
            <UploadBtn label="Add images" multiple onFiles={(f) => uploadTo("gallery", f)} />
            {s.images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {s.images.map((img, i) => (
                  <div key={img.url + i} className="relative aspect-square border border-white/10 overflow-hidden group">
                    <img src={img.url} className="h-full w-full object-cover" alt="" />
                    <button type="button" onClick={() => update("images", s.images.filter((_, x) => x !== i))} className="absolute top-1 right-1 h-6 w-6 grid place-items-center bg-black/70 opacity-0 group-hover:opacity-100 hover:bg-red-500/80">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>

        <Field label="Product Video URL (optional)">
          <input value={s.video_url} onChange={(e) => update("video_url", e.target.value)} placeholder="https://..." className={inputCls} />
        </Field>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Regular Price (৳)">
            <input required type="number" step="0.01" min="0" value={s.regular_price} onChange={(e) => update("regular_price", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Sale Price (optional)">
            <input type="number" step="0.01" min="0" value={s.sale_price} onChange={(e) => update("sale_price", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Cost Price (internal)">
            <input type="number" step="0.01" min="0" value={s.cost_price} onChange={(e) => update("cost_price", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Variants */}
      <Section title="Color Variants" action={
        <button type="button" onClick={addVariant} className="btn-zy-outline !py-2 !text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Color
        </button>
      }>
        {s.variants.length === 0 ? (
          <p className="text-xs text-muted-foreground border border-dashed border-white/10 py-8 text-center">
            No color variants yet. Add colors on the Colors tab first, then add them here.
          </p>
        ) : (
          <div className="space-y-3">
            {s.variants.map((v, vi) => {
              const color = colors.find((c) => c.id === v.color_id);
              return (
                <div key={vi} className="border border-white/10">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02]">
                    <button type="button" onClick={() => updateVariant(vi, { _open: !v._open })} className="flex items-center gap-3 flex-1 text-left">
                      {v._open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {color && <span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />}
                      <span className="font-display tracked-wide text-sm">
                        {color?.name ?? "Select color"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {v.sizes.length} size{v.sizes.length === 1 ? "" : "s"} · {v.images.length} image{v.images.length === 1 ? "" : "s"}
                      </span>
                    </button>
                    <button type="button" onClick={() => removeVariant(vi)} className="h-7 w-7 grid place-items-center text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {v._open && (
                    <div className="p-4 space-y-4 border-t border-white/10">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Color">
                          <select value={v.color_id} onChange={(e) => updateVariant(vi, { color_id: e.target.value })} className={inputCls}>
                            <option value="">— Select —</option>
                            {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </Field>
                        <Field label="SKU">
                          <input value={v.sku} onChange={(e) => updateVariant(vi, { sku: e.target.value })} className={inputCls} />
                        </Field>
                        <Field label="Price Override">
                          <input type="number" step="0.01" min="0" value={v.price_override} onChange={(e) => updateVariant(vi, { price_override: e.target.value })} className={inputCls} placeholder="Uses product price" />
                        </Field>
                      </div>

                      <Field label="Variant Images (unlimited)">
                        <div className="space-y-2">
                          <UploadBtn label="Add images" multiple onFiles={(f) => uploadTo({ variantIdx: vi }, f)} />
                          {v.images.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {v.images.map((img, i) => (
                                <div key={img.url + i} className="relative aspect-square border border-white/10 overflow-hidden group">
                                  <img src={img.url} className="h-full w-full object-cover" alt="" />
                                  <button type="button" onClick={() => updateVariant(vi, { images: v.images.filter((_, x) => x !== i) })} className="absolute top-1 right-1 h-6 w-6 grid place-items-center bg-black/70 opacity-0 group-hover:opacity-100 hover:bg-red-500/80">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs tracked-wide text-muted-foreground">SIZES & STOCK</label>
                          <div className="flex gap-1">
                            {sizes.filter((sz) => !v.sizes.some((x) => x.size_id === sz.id)).map((sz) => (
                              <button key={sz.id} type="button" onClick={() => addSize(vi, sz.id)} className="text-[10px] tracked-wide border border-white/10 px-2 py-1 hover:border-[color:var(--gold)]/50">
                                + {sz.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        {v.sizes.length === 0 ? (
                          <p className="text-xs text-muted-foreground border border-dashed border-white/10 py-6 text-center">
                            No sizes yet. Click a size above to add it.
                          </p>
                        ) : (
                          <div className="border border-white/10">
                            <table className="w-full text-xs">
                              <thead className="bg-white/[0.03] text-muted-foreground">
                                <tr>
                                  <th className="text-left px-3 py-2 font-normal">Size</th>
                                  <th className="text-left px-3 py-2 font-normal">Stock</th>
                                  <th className="text-left px-3 py-2 font-normal">SKU</th>
                                  <th className="text-left px-3 py-2 font-normal">Price Override</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.sizes.map((sz, si) => {
                                  const size = sizes.find((x) => x.id === sz.size_id);
                                  return (
                                    <tr key={si} className="border-t border-white/5">
                                      <td className="px-3 py-2 font-display tracked-wide">{size?.name}</td>
                                      <td className="px-3 py-2"><input type="number" min="0" value={sz.stock} onChange={(e) => updateSize(vi, si, { stock: e.target.value })} className={`${inputCls} !py-1`} /></td>
                                      <td className="px-3 py-2"><input value={sz.sku} onChange={(e) => updateSize(vi, si, { sku: e.target.value })} className={`${inputCls} !py-1`} /></td>
                                      <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={sz.price_override} onChange={(e) => updateSize(vi, si, { price_override: e.target.value })} className={`${inputCls} !py-1`} placeholder="—" /></td>
                                      <td className="px-3 py-2 text-right"><button type="button" onClick={() => removeSize(vi, si)} className="text-red-400 hover:text-red-300"><X className="h-3.5 w-3.5" /></button></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Inventory & Shipping */}
      <Section title="Inventory & Shipping">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Low Stock Alert Threshold">
            <input type="number" min="0" value={s.low_stock_threshold} onChange={(e) => update("low_stock_threshold", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" step="0.001" min="0" value={s.weight} onChange={(e) => update("weight", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Shipping Charge (৳)">
            <input type="number" step="0.01" min="0" value={s.shipping_charge} onChange={(e) => update("shipping_charge", e.target.value)} className={inputCls} disabled={s.free_shipping} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={s.free_shipping} onChange={(e) => update("free_shipping", e.target.checked)} className="accent-[color:var(--gold)]" />
          Free shipping
        </label>
      </Section>

      {/* SEO */}
      <Section title="SEO">
        <Field label="SEO Title">
          <input value={s.seo_title} onChange={(e) => update("seo_title", e.target.value)} className={inputCls} />
        </Field>
        <Field label="SEO Description">
          <textarea rows={3} value={s.seo_description} onChange={(e) => update("seo_description", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 -mx-6 border-t border-white/10 bg-card">
        <button type="button" onClick={onClose} className="btn-zy-outline !py-2 !text-xs">Cancel</button>
        <button type="submit" disabled={saving} className="btn-zy !py-2 !text-xs">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Product"}
        </button>
      </div>
    </form>
  );
}

/* ============ TAXONOMY TAB ============ */

type TaxKind = "categories" | "collections" | "colors" | "sizes";

function TaxonomyTab({ kind }: { kind: TaxKind }) {
  const qc = useQueryClient();
  const cfg: Record<TaxKind, { title: string; hasSlug: boolean; hasHex: boolean; queryKey: string; fetcher: () => Promise<{ id: string; name: string; sort_order: number; slug?: string; hex?: string }[]> }> = {
    categories: { title: "Categories", hasSlug: true, hasHex: false, queryKey: "categories", fetcher: fetchCategories as () => Promise<{ id: string; name: string; sort_order: number; slug?: string }[]> },
    collections: { title: "Collections", hasSlug: true, hasHex: false, queryKey: "collections", fetcher: fetchCollections as () => Promise<{ id: string; name: string; sort_order: number; slug?: string }[]> },
    colors: { title: "Colors", hasSlug: false, hasHex: true, queryKey: "colors", fetcher: fetchColors as () => Promise<{ id: string; name: string; sort_order: number; hex?: string }[]> },
    sizes: { title: "Sizes", hasSlug: false, hasHex: false, queryKey: "sizes", fetcher: fetchSizes as () => Promise<{ id: string; name: string; sort_order: number }[]> },
  };
  const c = cfg[kind];
  const { data: items = [], isLoading } = useQuery({ queryKey: [c.queryKey], queryFn: c.fetcher });

  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [slug, setSlug] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const payload: Record<string, string | number> = { name: name.trim(), sort_order: items.length };
      if (c.hasSlug) payload.slug = (slug || slugify(name)).trim();
      if (c.hasHex) payload.hex = hex;
      const { error } = await (supabase.from(kind) as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added");
      setName(""); setSlug(""); setHex("#000000");
      qc.invalidateQueries({ queryKey: [c.queryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, string | number> }) => {
      const { error } = await (supabase.from(kind) as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [c.queryKey] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(kind).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: [c.queryKey] });
    },
    onError: (e: Error) => toast.error(e.message.includes("foreign") ? "In use by products — remove from products first." : e.message),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const idx = items.findIndex((i) => i.id === id);
      const swap = items[idx + dir];
      if (!swap) return;
      await Promise.all([
        supabase.from(kind).update({ sort_order: swap.sort_order }).eq("id", id),
        supabase.from(kind).update({ sort_order: items[idx].sort_order }).eq("id", swap.id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [c.queryKey] }),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">{c.title}</h1>
        <p className="text-xs text-muted-foreground">{items.length} total</p>
      </div>

      <div className="border border-white/10 p-4 mb-6 grid gap-3 sm:grid-cols-[1fr_auto] items-end">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={kind === "colors" ? "Black" : kind === "sizes" ? "XL" : "T-Shirts"} />
          </Field>
          {c.hasSlug && (
            <Field label="Slug (optional)">
              <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={inputCls} placeholder="auto" />
            </Field>
          )}
          {c.hasHex && (
            <Field label="Hex">
              <div className="flex gap-2">
                <input value={hex} onChange={(e) => setHex(e.target.value)} className={inputCls} />
                <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-10 w-14 bg-transparent border border-white/10 cursor-pointer" />
              </div>
            </Field>
          )}
        </div>
        <button onClick={() => add.mutate()} disabled={add.isPending} className="btn-zy !py-3 !text-xs">
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </button>
      </div>

      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs tracked-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-normal w-16">Order</th>
              {c.hasHex && <th className="text-left px-4 py-3 font-normal w-16">Color</th>}
              <th className="text-left px-4 py-3 font-normal">Name</th>
              {c.hasSlug && <th className="text-left px-4 py-3 font-normal">Slug</th>}
              <th className="text-right px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nothing yet.</td></tr>
            ) : items.map((it, idx) => (
              <TaxRow
                key={it.id}
                item={it}
                idx={idx}
                total={items.length}
                cfg={c}
                onRename={(patch) => rename.mutate({ id: it.id, patch })}
                onDelete={() => { if (confirm(`Delete "${it.name}"?`)) del.mutate(it.id); }}
                onReorder={(dir) => reorder.mutate({ id: it.id, dir })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TaxRow({
  item, idx, total, cfg, onRename, onDelete, onReorder,
}: {
  item: { id: string; name: string; sort_order: number; slug?: string; hex?: string };
  idx: number; total: number;
  cfg: { hasSlug: boolean; hasHex: boolean };
  onRename: (patch: Record<string, string>) => void;
  onDelete: () => void;
  onReorder: (dir: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug ?? "");
  const [hex, setHex] = useState(item.hex ?? "#000000");
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="inline-flex gap-1">
          <button disabled={idx === 0} onClick={() => onReorder(-1)} className="h-6 w-6 grid place-items-center border border-white/10 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
          <button disabled={idx === total - 1} onClick={() => onReorder(1)} className="h-6 w-6 grid place-items-center border border-white/10 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
        </div>
      </td>
      {cfg.hasHex && (
        <td className="px-4 py-3">
          {editing ? (
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-8 w-10 bg-transparent border border-white/10 cursor-pointer" />
          ) : (
            <span className="inline-block h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: item.hex }} />
          )}
        </td>
      )}
      <td className="px-4 py-3 font-display tracked-wide">
        {editing ? <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /> : item.name}
      </td>
      {cfg.hasSlug && (
        <td className="px-4 py-3 text-muted-foreground text-xs">
          {editing ? <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={inputCls} /> : `/${item.slug}`}
        </td>
      )}
      <td className="px-4 py-3 text-right">
        <div className="inline-flex gap-1">
          {editing ? (
            <>
              <button onClick={() => {
                const patch: Record<string, string> = { name };
                if (cfg.hasSlug) patch.slug = slug || slugify(name);
                if (cfg.hasHex) patch.hex = hex;
                onRename(patch); setEditing(false);
              }} className="btn-zy !py-1 !px-3 !text-[10px]">Save</button>
              <button onClick={() => { setEditing(false); setName(item.name); setSlug(item.slug ?? ""); setHex(item.hex ?? "#000000"); }} className="border border-white/10 px-3 py-1 text-[10px]">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="h-8 w-8 grid place-items-center border border-white/10 hover:border-[color:var(--gold)]/50"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={onDelete} className="h-8 w-8 grid place-items-center border border-white/10 hover:border-red-500/50 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ============ Building blocks ============ */

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="font-display tracked-wide text-sm gold-gradient-text">{title.toUpperCase()}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs tracked-wide text-muted-foreground">{label.toUpperCase()}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function UploadBtn({ label, onFiles, multiple }: { label: string; onFiles: (f: FileList | null) => void; multiple?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-xs tracked-wide hover:border-[color:var(--gold)]/50 cursor-pointer">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
      {busy ? "UPLOADING…" : label.toUpperCase()}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={async (e) => {
          const files = e.target.files;
          e.target.value = "";
          if (!files) return;
          setBusy(true);
          try { await onFiles(files); } finally { setBusy(false); }
        }}
        className="hidden"
        disabled={busy}
      />
    </label>
  );
}

const inputCls =
  "w-full bg-transparent border border-white/10 px-3 py-2 text-sm focus:border-[color:var(--gold)]/60 outline-none";

/* ============ DASHBOARD TAB ============ */

function DashboardTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: fetchOrders,
  });
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: fetchAllProductsAdmin,
  });

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const pending = orders.filter((o) => o.status === "pending");
  const confirmed = orders.filter((o) => o.status === "confirmed");
  const delivered = orders.filter((o) => o.status === "delivered");
  const cancelled = orders.filter((o) => o.status === "cancelled" || o.status === "rejected");
  const lowStock = products.filter(
    (p: any) => (p.total_stock ?? 0) > 0 && (p.total_stock ?? 0) <= (p.low_stock_threshold ?? 5),
  );

  const cards = [
    { label: "Pending Orders", value: pending.length, tab: "orders" as Tab, accent: true },
    { label: "Today's Orders", value: todayOrders.length, tab: "orders" as Tab },
    { label: "Confirmed Orders", value: confirmed.length, tab: "orders" as Tab },
    { label: "Delivered Orders", value: delivered.length, tab: "orders" as Tab },
    { label: "Cancelled / Rejected", value: cancelled.length, tab: "orders" as Tab },
    { label: "Total Products", value: products.length, tab: "products" as Tab },
    { label: "Low Stock Products", value: lowStock.length, tab: "products" as Tab, accent: lowStock.length > 0 },
  ];

  if (ordersLoading || productsLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" /></div>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.tab)}
            className={`text-left border p-4 transition hover:border-[color:var(--gold)]/50 ${
              c.accent ? "border-[color:var(--gold)]/50 bg-[color:var(--gold)]/5" : "border-white/10"
            }`}
          >
            <div className={`font-display text-3xl ${c.accent ? "text-[color:var(--gold-bright)]" : ""}`}>{c.value}</div>
            <div className="text-[11px] tracked-wide text-muted-foreground mt-1">{c.label}</div>
          </button>
        ))}
      </div>

      <h2 className="font-display text-lg mb-4">Recent Orders</h2>
      <div className="border border-white/10 divide-y divide-white/5">
        {orders.slice(0, 6).map((o) => (
          <div key={o.id} className="px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <div className="font-display tracked-wide text-xs">{o.order_no} — {o.customer_name}</div>
              <div className="text-[11px] text-muted-foreground">{o.product_name} · {o.quantity}x · {formatPrice(o.total_price)}</div>
            </div>
            <OrderStatusPill status={o.status} />
          </div>
        ))}
        {orders.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</div>
        )}
      </div>
    </div>
  );
}

/* ============ ORDERS TAB ============ */

function OrderStatusPill({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pending: "border-amber-400/40 text-amber-300 bg-amber-400/10",
    confirmed: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    printing: "border-sky-400/40 text-sky-300 bg-sky-400/10",
    packed: "border-sky-400/40 text-sky-300 bg-sky-400/10",
    shipped: "border-violet-400/40 text-violet-300 bg-violet-400/10",
    delivered: "border-[color:var(--gold)]/50 text-[color:var(--gold-bright)] bg-[color:var(--gold)]/10",
    cancelled: "border-white/20 text-muted-foreground bg-white/5",
    rejected: "border-red-400/40 text-red-300 bg-red-400/10",
  };
  return (
    <span className={`text-[10px] tracked-wide px-2 py-1 border rounded-full ${styles[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: fetchOrders,
  });
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeOrders(() => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    });
    return unsub;
  }, [qc]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order updated");
    },
    onError: () => toast.error("Failed to update order"),
  });

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const filters: { id: "all" | OrderStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "printing", label: "Printing" },
    { id: "packed", label: "Packed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Orders</h1>
        <span className="text-xs text-muted-foreground">{orders.length} total</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[11px] tracked-wide px-3 py-1.5 border transition ${
              filter === f.id
                ? "border-[color:var(--gold)] text-[color:var(--gold-bright)]"
                : "border-white/10 text-muted-foreground hover:border-white/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-white/10 px-4 py-16 text-center text-sm text-muted-foreground">No orders in this view.</div>
      ) : (
        <div className="border border-white/10 divide-y divide-white/5">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            const nextStep = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(o.status) + 1];
            return (
              <div key={o.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="font-display tracked-wide text-xs flex items-center gap-2">
                      {o.order_no}
                      <span className="text-muted-foreground font-sans normal-case tracking-normal">— {o.customer_name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {o.product_name} {o.color_name ? `· ${o.color_name}` : ""} {o.size_name ? `· ${o.size_name}` : ""} · {o.quantity}x · {formatPrice(o.total_price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <OrderStatusPill status={o.status} />
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-4 bg-white/[0.015]">
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Phone</div>
                        <div>{o.phone}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Location</div>
                        <div>{o.area}, {o.district}</div>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <div className="text-muted-foreground">Address</div>
                        <div>{o.address}</div>
                      </div>
                      {o.note && (
                        <div className="space-y-1 sm:col-span-2">
                          <div className="text-muted-foreground">Note</div>
                          <div className="italic">{o.note}</div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Unit / Delivery / Total</div>
                        <div>{formatPrice(o.unit_price)} + {formatPrice(o.delivery_charge)} = <span className="text-[color:var(--gold-bright)]">{formatPrice(o.total_price)}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Created</div>
                        <div>{new Date(o.created_at).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      {o.status === "pending" && (
                        <>
                          <button
                            onClick={() => statusMutation.mutate({ id: o.id, status: "confirmed" })}
                            className="text-[11px] tracked-wide px-3 py-2 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 inline-flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirm Order
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: o.id, status: "rejected" })}
                            className="text-[11px] tracked-wide px-3 py-2 border border-red-400/40 text-red-300 hover:bg-red-400/10 inline-flex items-center gap-1.5"
                          >
                            <Ban className="h-3.5 w-3.5" /> Reject Order
                          </button>
                        </>
                      )}
                      {nextStep && !["pending", "cancelled", "rejected"].includes(o.status) && (
                        <button
                          onClick={() => statusMutation.mutate({ id: o.id, status: nextStep })}
                          className="text-[11px] tracked-wide px-3 py-2 border border-[color:var(--gold)]/50 text-[color:var(--gold-bright)] hover:bg-[color:var(--gold)]/10 inline-flex items-center gap-1.5"
                        >
                          Move to {ORDER_STATUS_LABEL[nextStep]}
                        </button>
                      )}
                      {!["delivered", "cancelled", "rejected"].includes(o.status) && (
                        <button
                          onClick={() => statusMutation.mutate({ id: o.id, status: "cancelled" })}
                          className="text-[11px] tracked-wide px-3 py-2 border border-white/15 text-muted-foreground hover:border-white/30"
                        >
                          Cancel Order
                        </button>
                      )}
                      <a
                        href={whatsappUrl(o.phone.replace(/\D/g, ""), buildWhatsappMessage(o))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] tracked-wide px-3 py-2 border border-white/15 hover:border-white/30 inline-flex items-center gap-1.5 ml-auto"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Message Customer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ SETTINGS TAB ============ */

function SettingsTab() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["app-settings"], queryFn: fetchAppSettings });
  const [form, setForm] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings, form]);

  if (isLoading || !form) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" /></div>;
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await Promise.all([
        upsertAppSetting("whatsapp_number", form.whatsapp_number),
        upsertAppSetting("delivery_charge_dhaka", form.delivery_charge_dhaka),
        upsertAppSetting("delivery_charge_outside_dhaka", form.delivery_charge_outside_dhaka),
        upsertAppSetting("brand_name", form.brand_name),
        upsertAppSetting("currency_symbol", form.currency_symbol),
        upsertAppSetting("low_stock_default", form.low_stock_default),
      ]);
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-6">Settings</h1>

      <div className="space-y-5">
        <div>
          <label className="text-xs tracked-wide text-muted-foreground">WHATSAPP NUMBER (international format, no + or leading 0)</label>
          <input
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            className={inputCls}
            placeholder="8801XXXXXXXXX"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracked-wide text-muted-foreground">DELIVERY CHARGE — DHAKA (৳)</label>
            <input
              type="number"
              value={form.delivery_charge_dhaka}
              onChange={(e) => setForm({ ...form, delivery_charge_dhaka: Number(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs tracked-wide text-muted-foreground">DELIVERY CHARGE — OUTSIDE DHAKA (৳)</label>
            <input
              type="number"
              value={form.delivery_charge_outside_dhaka}
              onChange={(e) => setForm({ ...form, delivery_charge_outside_dhaka: Number(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="h-px bg-white/10 my-2" />
        <div>
          <label className="text-xs tracked-wide text-muted-foreground">BRAND NAME</label>
          <input
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracked-wide text-muted-foreground">CURRENCY SYMBOL</label>
            <input
              value={form.currency_symbol}
              onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs tracked-wide text-muted-foreground">LOW STOCK THRESHOLD (DEFAULT)</label>
            <input
              type="number"
              value={form.low_stock_default}
              onChange={(e) => setForm({ ...form, low_stock_default: Number(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-zy !py-3 mt-2 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
