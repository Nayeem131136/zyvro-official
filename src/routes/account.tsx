import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchMyOrders, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/settings";
import { STEADFAST_STATUS_LABEL } from "@/lib/steadfast";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      { title: "My Orders · ZYVRO" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function AccountPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setSignedIn(!!data.user);
        setEmail(data.user?.email ?? "");
      } catch {
        if (!mounted) return;
        setSignedIn(false);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authChecked && !signedIn) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [authChecked, signedIn, navigate]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    enabled: signedIn,
  });

  async function handleSignOut() {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/";
  }

  if (!authChecked || !signedIn) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 md:pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-3">YOUR ACCOUNT</div>
              <h1 className="font-display text-4xl md:text-5xl">My Orders</h1>
              <div className="text-xs text-muted-foreground mt-2">{email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[11px] tracked-wide border border-white/10 px-4 py-2.5 hover:border-white/30 inline-flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--gold-bright)]" />
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-white/10 px-6 py-16 text-center">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-6">
                You haven't placed any orders yet. Orders you place while signed in will show up here.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center h-11 px-6 rounded-full bg-[color:var(--gold)]/90 text-black text-xs font-display tracked-wide hover:bg-[color:var(--gold-bright)] transition"
              >
                Browse the Collection
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function OrderCard({ order: o }: { order: Order }) {
  const stepIndex = ORDER_STATUS_FLOW.indexOf(o.status);
  const isTerminalNegative = o.status === "cancelled" || o.status === "rejected";

  return (
    <div className="border border-white/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-display tracked-wide text-sm">{o.order_no}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {new Date(o.created_at).toLocaleString()}
          </div>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className="text-sm mb-4">
        {o.product_name}
        {o.color_name ? ` · ${o.color_name}` : ""}
        {o.size_name ? ` · ${o.size_name}` : ""} · {o.quantity}x
        <span className="text-[color:var(--gold-bright)] ml-2">{formatPrice(o.total_price)}</span>
      </div>

      {!isTerminalNegative && (
        <div className="flex items-center gap-1 mb-4">
          {ORDER_STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  i <= stepIndex ? "bg-[color:var(--gold)]" : "bg-white/10"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {o.steadfast_tracking_code && (
        <div className="border-t border-white/5 pt-3 mt-1 flex flex-wrap items-center gap-2 text-xs">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Courier Tracking:</span>
          <span className="text-[color:var(--gold-bright)]">{o.steadfast_tracking_code}</span>
          <span className="px-2 py-0.5 border border-white/15 text-[10px] tracked-wide ml-auto">
            {STEADFAST_STATUS_LABEL[o.steadfast_status ?? ""] ?? o.steadfast_status ?? "Processing"}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const negative = status === "cancelled" || status === "rejected";
  const positive = status === "delivered";
  return (
    <span
      className={`text-[10px] tracked-wide px-2.5 py-1 border ${
        negative
          ? "border-red-400/40 text-red-300"
          : positive
            ? "border-emerald-400/40 text-emerald-300"
            : "border-[color:var(--gold)]/50 text-[color:var(--gold-bright)]"
      }`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
