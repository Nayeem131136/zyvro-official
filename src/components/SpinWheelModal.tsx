import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  SPIN_SEGMENTS,
  pickWeightedSegment,
  recordSpin,
  formatCountdown,
  useActiveSpinOffer,
  canSpinAgain,
} from "@/lib/spin";

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 6;
const SEG_ANGLE = 360 / SPIN_SEGMENTS.length;

function polarToXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function wedgePath(index: number) {
  const start = index * SEG_ANGLE;
  const end = start + SEG_ANGLE;
  const p1 = polarToXY(start, RADIUS);
  const p2 = polarToXY(end, RADIUS);
  return `M ${CENTER} ${CENTER} L ${p1.x} ${p1.y} A ${RADIUS} ${RADIUS} 0 0 1 ${p2.x} ${p2.y} Z`;
}

export function SpinWheelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { offer, rawOffer, isLoading } = useActiveSpinOffer();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsSignedIn(!!data.user));
  }, []);

  // Re-render every second while an offer is active, to keep the countdown live.
  useEffect(() => {
    if (!offer) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [offer]);

  if (!open) return null;

  const spinAllowed = isSignedIn && canSpinAgain(rawOffer) && !spinning && result === null;

  function doSpin() {
    if (!spinAllowed) return;
    setSpinning(true);
    const { percent, index } = pickWeightedSegment();
    const extraSpins = 6;
    const target = extraSpins * 360 - (index + 0.5) * SEG_ANGLE;
    setRotation(target);
    window.setTimeout(async () => {
      try {
        await recordSpin(percent);
        setResult(percent);
        toast.success(`🎉 You won ${percent}% OFF — valid for 24 hours!`);
      } catch {
        toast.error("Couldn't save your spin result. Please try again.");
      } finally {
        setSpinning(false);
      }
    }, 4200);
  }

  const activePercent = result ?? offer?.percent ?? null;
  const activeExpiresAt = offer?.expires_at ?? null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full grid place-items-center p-4">
        <div className="w-full max-w-md bg-card border border-[color:var(--gold)]/30 relative p-6 sm:p-8 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 grid place-items-center hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-xs tracked-wide text-[color:var(--gold-bright)] mb-1">ZYVRO EXCLUSIVE</div>
          <h2 className="font-display text-2xl mb-1">Spin & Win</h2>
          <p className="text-xs text-muted-foreground mb-6">Up to 30% OFF — every product, one spin.</p>

          {isSignedIn === false && (
            <div className="space-y-4 py-6">
              <Gift className="h-10 w-10 mx-auto text-[color:var(--gold-bright)]" />
              <p className="text-sm text-muted-foreground">Sign in to spin the wheel and unlock your discount.</p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                onClick={onClose}
                className="btn-zy inline-flex !py-3 !px-6"
              >
                Sign In / Sign Up
              </Link>
            </div>
          )}

          {isSignedIn && isLoading && (
            <div className="py-16"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[color:var(--gold-bright)]" /></div>
          )}

          {isSignedIn && !isLoading && (
            <>
              <div className="relative mx-auto mb-6" style={{ width: SIZE, height: SIZE }}>
                {/* Pointer */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-1 z-10"
                  style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "20px solid var(--gold-bright)" }}
                />
                <svg
                  viewBox={`0 0 ${SIZE} ${SIZE}`}
                  width={SIZE}
                  height={SIZE}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.72, 0.15, 1)" : "none",
                  }}
                >
                  <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="none" stroke="var(--gold)" strokeWidth={3} opacity={0.6} />
                  {SPIN_SEGMENTS.map((pct, i) => {
                    const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
                    const labelPos = polarToXY(mid, RADIUS * 0.68);
                    return (
                      <g key={pct}>
                        <path d={wedgePath(i)} fill={i % 2 === 0 ? "oklch(0.16 0 0)" : "oklch(0.1 0 0)"} stroke="var(--gold)" strokeOpacity={0.25} strokeWidth={1} />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          fill="var(--gold-bright)"
                          fontSize={16}
                          fontWeight={700}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                        >
                          {pct}%
                        </text>
                      </g>
                    );
                  })}
                  <circle cx={CENTER} cy={CENTER} r={22} fill="var(--gold-bright)" />
                </svg>
              </div>

              {activePercent == null ? (
                <button
                  type="button"
                  onClick={doSpin}
                  disabled={!spinAllowed}
                  className="btn-zy !py-3.5 !px-10 disabled:opacity-50"
                >
                  {spinning ? <Loader2 className="h-4 w-4 animate-spin" /> : "SPIN NOW"}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-display text-[color:var(--gold-bright)]">
                    🎉 {activePercent}% OFF unlocked!
                  </div>
                  {activeExpiresAt && (
                    <div className="text-xs text-muted-foreground">
                      Applies automatically at checkout — valid for {formatCountdown(activeExpiresAt)}
                    </div>
                  )}
                  <button type="button" onClick={onClose} className="btn-zy-outline !py-2.5 !px-8 mt-2">
                    Start Shopping
                  </button>
                </div>
              )}

              {activePercent == null && !canSpinAgain(rawOffer) && rawOffer && (
                <p className="text-[11px] text-muted-foreground mt-3">
                  You've already spun. Come back in {formatCountdown(rawOffer.expires_at)} for another spin.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
