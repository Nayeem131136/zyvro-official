const items = [
  "PREMIUM QUALITY",
  "LIMITED DROPS",
  "OVERSIZED FIT",
  "OWN YOUR STYLE",
  "BUILT DIFFERENT",
  "MADE FOR THE CULTURE",
];

export function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-[oklch(0.06_0_0)] py-4">
      <div className="flex gap-12 whitespace-nowrap animate-marquee">
        {row.map((t, i) => (
          <span
            key={i}
            className="font-display text-sm tracked-wide text-[color:var(--gold)]/80"
          >
            {t} <span className="mx-6 text-[color:var(--gold)]/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
