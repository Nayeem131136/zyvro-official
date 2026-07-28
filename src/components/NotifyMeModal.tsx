import { useState, type FormEvent } from "react";
import { Bell, X, Check } from "lucide-react";
import { subscribeNotify } from "@/lib/notifications";
import { toast } from "sonner";

export function NotifyMeModal({
  open,
  onClose,
  productId,
  productName,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await subscribeNotify(productId, email);
      setDone(true);
      toast.success("You're on the list!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-[color:var(--gold)]/30 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center hover:bg-white/5"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[color:var(--gold)]/50 bg-[rgba(232,200,120,0.08)] mb-5">
            {done ? (
              <Check className="h-7 w-7 text-emerald-400" />
            ) : (
              <Bell className="h-7 w-7 text-[color:var(--gold-bright)]" />
            )}
          </div>
          <h3 className="font-display text-2xl mb-2">
            {done ? "You're on the list" : "Notify Me"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {done
              ? `We'll email you the moment "${productName}" drops.`
              : `Get notified when "${productName}" is available.`}
          </p>
          {!done && (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-white/10 px-4 py-3 text-sm focus:border-[color:var(--gold)]/50 outline-none"
              />
              <button type="submit" disabled={loading} className="btn-zy w-full !py-3 disabled:opacity-60">
                {loading ? "Adding…" : "Notify Me"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
