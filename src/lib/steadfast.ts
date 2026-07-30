import { createServerFn } from "@tanstack/react-start";

/**
 * Steadfast Courier API integration.
 *
 * SECURITY: These functions run ONLY on the server (via TanStack Start's
 * createServerFn). The API key/secret are read from plain (non VITE_-
 * prefixed) environment variables, so Vite never bundles them into the
 * browser JS — they are never visible to the customer or admin's browser.
 *
 * Add these two environment variables in your Vercel project settings
 * (Project Settings -> Environment Variables), NOT prefixed with VITE_:
 *   STEADFAST_API_KEY
 *   STEADFAST_SECRET_KEY
 * Get them from your Steadfast Merchant Panel -> API Support.
 */

const STEADFAST_BASE = "https://portal.packzy.com/api/v1";

function steadfastHeaders() {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error(
      "Steadfast API keys are not configured. Add STEADFAST_API_KEY and STEADFAST_SECRET_KEY in your Vercel environment variables.",
    );
  }
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "Secret-Key": secretKey,
  };
}

export type CreateConsignmentInput = {
  orderId: string; // internal order UUID (used to persist the result back)
  invoice: string; // order_no, e.g. ZYV-000123
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
  itemDescription?: string;
};

/** Admin-only: create a Steadfast delivery consignment for a confirmed order. */
export const createSteadfastConsignment = createServerFn({ method: "POST" })
  .validator((data: CreateConsignmentInput) => data)
  .handler(async ({ data }) => {
    const res = await fetch(`${STEADFAST_BASE}/create_order`, {
      method: "POST",
      headers: steadfastHeaders(),
      body: JSON.stringify({
        invoice: data.invoice,
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone,
        recipient_address: data.recipientAddress,
        cod_amount: data.codAmount,
        note: data.note ?? "",
        item_description: data.itemDescription ?? "",
      }),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 200) {
      throw new Error(json.message || "Steadfast order creation failed");
    }
    const consignmentId = String(json.consignment?.consignment_id ?? "");
    const trackingCode = String(json.consignment?.tracking_code ?? "");
    const status = String(json.consignment?.status ?? "in_review");

    // Persist onto the order using the service role (RLS-safe: server-side only).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        steadfast_consignment_id: consignmentId,
        steadfast_tracking_code: trackingCode,
        steadfast_status: status,
      })
      .eq("id", data.orderId);

    return { consignmentId, trackingCode, status };
  });

/** Fetch current delivery status for a consignment and persist it onto the order. */
export const refreshSteadfastStatus = createServerFn({ method: "POST" })
  .validator((data: { orderId: string; consignmentId: string }) => data)
  .handler(async ({ data }) => {
    const res = await fetch(`${STEADFAST_BASE}/status_by_cid/${data.consignmentId}`, {
      headers: steadfastHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 200) {
      throw new Error(json.message || "Couldn't fetch Steadfast status");
    }
    const status = String(json.delivery_status ?? "unknown");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ steadfast_status: status }).eq("id", data.orderId);
    return { status };
  });

/** Admin-only: check current Steadfast account COD balance. */
export const getSteadfastBalance = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch(`${STEADFAST_BASE}/get_balance`, { headers: steadfastHeaders() });
  const json = await res.json();
  if (!res.ok || json.status !== 200) {
    throw new Error(json.message || "Couldn't fetch Steadfast balance");
  }
  return { balance: Number(json.current_balance ?? 0) };
});

/** Human-friendly labels for Steadfast's delivery_status values. */
export const STEADFAST_STATUS_LABEL: Record<string, string> = {
  pending: "Pending Pickup",
  delivered_approval_pending: "Delivered (Approval Pending)",
  partial_delivered_approval_pending: "Partially Delivered (Approval Pending)",
  cancelled_approval_pending: "Cancelled (Approval Pending)",
  unknown_approval_pending: "Unknown (Approval Pending)",
  delivered: "Delivered",
  partial_delivered: "Partially Delivered",
  cancelled: "Cancelled",
  hold: "On Hold",
  in_review: "In Review",
  unknown: "Unknown",
};
