import { supabase } from "@/integrations/supabase/client";

export async function subscribeNotify(productId: string, email: string) {
  const trimmed = email.trim().toLowerCase();
  const { error } = await supabase.from("product_notifications").insert({
    product_id: productId,
    email: trimmed,
  });
  if (error) {
    if (error.code === "23505") return { ok: true, dedup: true };
    throw error;
  }
  return { ok: true, dedup: false };
}

export interface NotificationRow {
  id: string;
  product_id: string;
  email: string;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
}

export async function fetchAllNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("product_notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotified(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase
    .from("product_notifications")
    .update({ notified: true, notified_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function deleteNotifications(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from("product_notifications").delete().in("id", ids);
  if (error) throw error;
}
