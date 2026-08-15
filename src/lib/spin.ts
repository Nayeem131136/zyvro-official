import { supabase } from "@/integrations/supabase/client";

export const SPIN_SEGMENTS = [6, 9, 12, 15, 18, 21, 24, 27, 30, 35] as const;
export type SpinSegment = (typeof SPIN_SEGMENTS)[number];

// Weighted so the wheel *usually* (not always — it should still feel like a
// real spin) lands in the 15–30% range, per the "twist".
const SEGMENT_WEIGHTS: Record<SpinSegment, number> = {
  6: 2, 9: 3, 12: 5, 15: 14, 18: 16, 21: 16, 24: 14, 27: 10, 30: 8, 35: 4,
};

/** Weighted-random pick of a segment (and its index, for animating the wheel to it). */
export function pickWeightedSegment(): { percent: SpinSegment; index: number } {
  const total = Object.values(SEGMENT_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    const seg = SPIN_SEGMENTS[i];
    r -= SEGMENT_WEIGHTS[seg];
    if (r <= 0) return { percent: seg, index: i };
  }
  return { percent: SPIN_SEGMENTS[SPIN_SEGMENTS.length - 1], index: SPIN_SEGMENTS.length - 1 };
}

export type SpinOffer = {
  percent: number;
  spun_at: string;
  expires_at: string;
};

/** The signed-in customer's current spin offer, or null if they've never spun. */
export async function fetchMySpinOffer(): Promise<SpinOffer | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("spin_offers")
    .select("percent, spun_at, expires_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export function isOfferActive(offer: SpinOffer | null): offer is SpinOffer {
  return !!offer && new Date(offer.expires_at).getTime() > Date.now();
}

export function canSpinAgain(offer: SpinOffer | null): boolean {
  if (!offer) return true;
  return new Date(offer.expires_at).getTime() <= Date.now();
}

/** Record a new spin result (24h validity from now). Requires sign-in. */
export async function recordSpin(percent: number): Promise<SpinOffer> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const row = { user_id: userData.user.id, percent, spun_at: now.toISOString(), expires_at: expires.toISOString() };
  const { data, error } = await supabase
    .from("spin_offers")
    .upsert(row, { onConflict: "user_id" })
    .select("percent, spun_at, expires_at")
    .single();
  if (error) throw error;
  return data;
}

/** Apply a spin discount percent to a price, rounded to the nearest taka. */
export function applySpinDiscount(price: number, percent: number): number {
  return Math.round(price * (1 - percent / 100));
}

export function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// ---- Shared hook -----------------------------------------------------
import { useQuery } from "@tanstack/react-query";

/** Returns the signed-in customer's active (unexpired) spin offer, or null. */
export function useActiveSpinOffer() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-spin-offer"],
    queryFn: fetchMySpinOffer,
    staleTime: 15_000,
  });
  const active = isOfferActive(data ?? null) ? data! : null;
  return { offer: active, rawOffer: data ?? null, isLoading };
}
