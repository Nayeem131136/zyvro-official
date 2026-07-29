import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ADMIN_EMAIL } from "@/lib/admin";
import logoAsset from "@/assets/zyvro-logo.png";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Login · ZYVRO" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email?.toLowerCase() === ADMIN_EMAIL) {
        navigate({ to: "/admin" });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        throw new Error("Not authorized");
      }
      toast.success("Welcome, Admin");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center gap-3 mb-8">
          <img src={logoAsset} alt="ZYVRO" className="h-14 w-14" />
          <span className="font-display text-2xl tracked-wide gold-gradient-text">ZYVRO</span>
        </Link>

        <div className="border border-white/10 p-8 bg-card">
          <h1 className="font-display text-2xl tracked-wide text-center mb-1">Admin Access</h1>
          <p className="text-xs tracked-wide text-muted-foreground text-center mb-6">
            Restricted to authorized personnel
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs tracked-wide text-muted-foreground">EMAIL</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-transparent border border-white/10 px-3 py-3 text-sm focus:border-[color:var(--gold)]/60 outline-none"
              />
            </div>
            <div>
              <label className="text-xs tracked-wide text-muted-foreground">PASSWORD</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-transparent border border-white/10 px-3 py-3 text-sm focus:border-[color:var(--gold)]/60 outline-none"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-zy w-full !py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
