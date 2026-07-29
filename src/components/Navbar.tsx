import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ShieldCheck, LogOut } from "lucide-react";
import logoCleanUrl from "@/assets/zyvro-logo-clean.png";
import { useAdminSession } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAdmin, loading: adminLoading, email } = useAdminSession();
  const isSignedIn = !!email;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
  }


  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20">
        <Link to="/" className="flex items-center shrink-0" onClick={() => setOpen(false)}>
          <img src={logoCleanUrl} alt="ZYVRO" className="h-10 md:h-12 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-display text-sm tracked-wide text-foreground/80 hover:text-[color:var(--gold-bright)] transition-colors"
              activeProps={{ className: "text-[color:var(--gold-bright)]" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!adminLoading && isAdmin && (
            <>
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-[color:var(--gold)]/50 text-[10px] font-display tracked-wide text-[color:var(--gold-bright)] hover:bg-[color:var(--gold)]/10 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> ADMIN
              </Link>
            </>
          )}
          {!adminLoading && isSignedIn && (
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-foreground/70 hover:border-white/30 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="md:hidden h-10 w-10 grid place-items-center text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-md">
          <nav className="flex flex-col px-6 py-6 gap-5">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-display tracked-wide text-foreground/85"
              >
                {l.label}
              </Link>
            ))}
            {!adminLoading && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="font-display tracked-wide text-[color:var(--gold-bright)] inline-flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            {!adminLoading && isSignedIn && (
              <button
                onClick={handleSignOut}
                className="text-left font-display tracked-wide text-foreground/70 inline-flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            )}

          </nav>
        </div>
      )}
    </header>
  );
}
