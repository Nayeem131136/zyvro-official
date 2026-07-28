import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Facebook } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { BRAND, whatsappGeneralUrl } from "@/lib/config";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact · ZYVRO" },
      { name: "description", content: "Reach out to ZYVRO — order via WhatsApp or follow on Facebook." },
    ],
  }),
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-3">GET IN TOUCH</div>
          </Reveal>
          <Reveal delay={150}>
            <h1 className="font-display text-5xl md:text-7xl">Talk to us.</h1>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-6 max-w-xl mx-auto text-muted-foreground">
              Fastest way to order or ask about a drop is straight to our WhatsApp.
            </p>
          </Reveal>

          <Reveal delay={450}>
            <div className="mt-10">
              <a href={whatsappGeneralUrl()} target="_blank" rel="noopener noreferrer" className="btn-zy">
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal delay={600}>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 max-w-lg mx-auto">
              <SocialCard href={whatsappGeneralUrl()} label="WhatsApp" handle="+880 1577-142710">
                <MessageCircle className="h-6 w-6" />
              </SocialCard>
              <SocialCard href={BRAND.socials.facebook} label="Facebook" handle="/zyvro.official">
                <Facebook className="h-6 w-6" />
              </SocialCard>
            </div>
          </Reveal>

          <Reveal delay={750}>
            <div className="mt-16 gold-hairline w-32 mx-auto" />
          </Reveal>
          <Reveal delay={900}>
            <p className="mt-6 text-xs text-muted-foreground tracked-wide">
              ZYVRO · {BRAND.origin} · EST. {BRAND.est}
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SocialCard({ href, label, handle, children }: { href: string; label: string; handle: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group border border-white/10 p-6 flex flex-col items-center gap-2 hover:border-[color:var(--gold)]/50 hover:bg-white/[0.02] transition"
    >
      <div className="text-[color:var(--gold-bright)] group-hover:scale-110 transition-transform">
        {children}
      </div>
      <div className="font-display tracked-wide mt-2">{label}</div>
      <div className="text-xs text-muted-foreground">{handle}</div>
    </a>
  );
}
