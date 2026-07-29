import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import logoAsset from "@/assets/zyvro-logo.png";
import heroAsset from "@/assets/zyvro-hero.png";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About · ZYVRO — Built Different" },
      { name: "description", content: "The story behind ZYVRO — a premium Bangladeshi streetwear brand redefining oversized fits, limited drops, and street culture." },
      { property: "og:title", content: "About ZYVRO" },
      { property: "og:description", content: "The premium Bangladeshi streetwear brand redefining oversized." },
    ],
  }),
});

const values = [
  { title: "Premium Quality", body: "Heavyweight fabric, engineered stitching, and finishing that outlasts trends." },
  { title: "Oversized Comfort", body: "Drop-shoulder silhouettes cut for movement, not the mirror." },
  { title: "Limited Editions", body: "Small, curated drops. When they're gone, they're gone." },
  { title: "Made for the Culture", body: "Rooted in Bangladesh. Built for streets everywhere." },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <img src={heroAsset.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <Reveal>
            <img src={logoAsset.url} alt="ZYVRO" className="mx-auto h-24 md:h-32" />
          </Reveal>
          <Reveal delay={200}>
            <h1 className="mt-8 font-display text-6xl md:text-8xl">
              OWN YOUR<br /><span className="gold-gradient-text">STYLE.</span>
            </h1>
          </Reveal>
          <Reveal delay={400}>
            <div className="gold-hairline w-32 mx-auto mt-8" />
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 space-y-8">
          <Reveal>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
              ZYVRO is not just a t-shirt brand — it's a <span className="text-[color:var(--gold-bright)]">Premium Bangladeshi Streetwear</span> brand.
              We create clothing that not only looks good but feels premium the moment it touches your skin.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-muted-foreground leading-relaxed">
              At the center of everything we do is the oversized drop-shoulder silhouette — minimal in design,
              striking in presence. We combine heavyweight fabric, flawless finishing, and a design language
              that speaks without shouting.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="text-muted-foreground leading-relaxed">
              Our philosophy is simple: <em className="not-italic text-foreground">Own Your Style</em>.
              We're not here to follow what's trending. We're here to build the trend — piece by piece,
              drop by drop. A ZYVRO tee isn't just clothing. It's an expression of personality,
              confidence, and the culture you carry.
            </p>
          </Reveal>
          <Reveal delay={450}>
            <p className="text-muted-foreground leading-relaxed">
              We started in Bangladesh with an ambition that reaches far beyond it — to build a streetwear
              brand the world recognizes. This is only the beginning.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-20 border-y border-white/5 bg-[oklch(0.09_0_0)]">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-3 text-center">WHAT WE STAND FOR</div>
          </Reveal>
          <Reveal delay={150}>
            <h2 className="font-display text-4xl md:text-5xl text-center mb-16">Our Values</h2>
          </Reveal>
          <div className="grid gap-8 md:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100}>
                <div className="border border-white/10 p-8 hover:border-[color:var(--gold)]/40 transition">
                  <div className="font-display text-2xl tracked-wide gold-gradient-text">{v.title}</div>
                  <p className="mt-4 text-muted-foreground text-sm leading-relaxed">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="font-display text-5xl md:text-7xl leading-tight">
              <span className="text-foreground/25">BUILT IN</span> <span className="gold-gradient-text">{BRAND.origin.toUpperCase()}.</span><br />
              <span className="text-foreground/25">MADE FOR</span> <span className="gold-gradient-text">THE WORLD.</span>
            </h2>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-8 text-xs tracked-wide text-muted-foreground">EST. {BRAND.est}</div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
