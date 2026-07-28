import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import logoAsset from "@/assets/zyvro-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign In · ZYVRO" },
      { name: "description", content: "Sign in or create your ZYVRO account." },
      { property: "og:title", content: "Sign In · ZYVRO" },
      { property: "og:description", content: "Sign in or create your ZYVRO account." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to ZYVRO.");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 h-10 px-4 rounded-full border border-white/15 text-xs font-display tracked-wide text-foreground/80 hover:text-[color:var(--gold-bright)] hover:border-[color:var(--gold)]/50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> BACK
      </Link>
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center gap-3 mb-8">
          <img src={logoAsset.url} alt="ZYVRO" className="h-14 w-14" />
          <span className="font-display text-2xl tracked-wide gold-gradient-text">ZYVRO</span>
        </Link>

        <div className="border border-white/10 p-8 bg-card">
          <h1 className="font-display text-2xl tracked-wide text-center mb-1">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-xs tracked-wide text-muted-foreground text-center mb-6">
            {mode === "signin" ? "Welcome back to ZYVRO" : "Join the ZYVRO community"}
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
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-transparent border border-white/10 px-3 py-3 text-sm focus:border-[color:var(--gold)]/60 outline-none"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-zy w-full !py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-xs tracked-wide text-muted-foreground hover:text-[color:var(--gold-bright)]"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
