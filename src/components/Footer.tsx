import { Link } from "@tanstack/react-router";
import { Facebook, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoCleanUrl from "@/assets/zyvro-logo-clean.png";
import { BRAND, whatsappGeneralUrl } from "@/lib/config";
import { fetchAppSettings } from "@/lib/settings";

export function Footer() {
  const { data: settings } = useQuery({ queryKey: ["app-settings"], queryFn: fetchAppSettings });
  return (
    <footer className="border-t border-white/5 bg-[oklch(0.06_0_0)]">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={logoCleanUrl} alt="ZYVRO" className="h-16 object-contain object-left" />
          <p className="mt-5 max-w-sm text-sm text-muted-foreground tracked-wide leading-relaxed">
            {BRAND.tagline} — Premium streetwear built for those who create their own trends.
          </p>
          <p className="mt-6 text-xs text-muted-foreground/70 tracked-wide">
            EST. {BRAND.est} · {BRAND.origin}
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm tracked-wide text-foreground/70">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-[color:var(--gold-bright)]">Shop</Link></li>
            <li><Link to="/about" className="text-muted-foreground hover:text-[color:var(--gold-bright)]">About</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-[color:var(--gold-bright)]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm tracked-wide text-foreground/70">Follow</h4>
          <div className="mt-4 flex gap-3">
            <a href={BRAND.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-10 w-10 grid place-items-center border border-white/10 hover:border-[color:var(--gold)]/50 hover:text-[color:var(--gold-bright)] transition">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={whatsappGeneralUrl(undefined, settings?.whatsapp_number)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="h-10 w-10 grid place-items-center border border-white/10 hover:border-[color:var(--gold)]/50 hover:text-[color:var(--gold-bright)] transition">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="gold-hairline" />
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/70 tracked-wide">
        <span>© {new Date().getFullYear()} ZYVRO. All rights reserved.</span>
        <span>Made in Bangladesh</span>
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-6 text-center text-[11px] text-muted-foreground/50 tracked-wide">
        <span>
          Developed by{" "}
          <a
            href="https://mahdi-hasan-nayeem-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--gold-bright)] underline underline-offset-2"
          >
            Md. Mahdi Hasan Nayeem
          </a>
        </span>
      </div>
    </footer>
  );
}
