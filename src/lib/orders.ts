import { supabase } from "@/integrations/supabase/client";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "printing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rejected";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "printing",
  "packed",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  printing: "Printing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export type Order = {
  id: string;
  order_no: string;
  customer_name: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  note: string | null;
  product_id: string | null;
  product_name: string;
  product_url: string | null;
  color_name: string | null;
  size_name: string | null;
  quantity: number;
  unit_price: number;
  delivery_charge: number;
  total_price: number;
  status: OrderStatus;
  customer_user_id: string | null;
  is_multi_item: boolean;
  steadfast_consignment_id: string | null;
  steadfast_tracking_code: string | null;
  steadfast_status: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_url: string | null;
  color_name: string | null;
  size_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sort_order: number;
};

export type NewOrderInput = {
  customer_name: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  note?: string;
  product_id?: string | null;
  product_name: string;
  product_url?: string;
  color_name?: string;
  size_name?: string;
  quantity: number;
  unit_price: number;
  delivery_charge: number;
  total_price: number;
  customer_user_id?: string | null;
};

/** Customer-facing: create a Pending order. Public insert, no login required. */
/** Normalize a Bangladeshi phone number to include the +880 country code. */
export function normalizeBdPhone(raw: string): string {
  let p = raw.trim().replace(/[\s-]/g, "");
  if (p.startsWith("+880")) return p;
  if (p.startsWith("880")) return `+${p}`;
  if (p.startsWith("0")) return `+880${p.slice(1)}`;
  if (/^1\d{9}$/.test(p)) return `+880${p}`; // e.g. 1XXXXXXXXX with no leading 0
  return p; // already has some other country code or unrecognized format — leave as-is
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({ ...input, phone: normalizeBdPhone(input.phone), status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Order;
}

export type NewCartItemInput = {
  product_id?: string | null;
  product_name: string;
  product_url?: string;
  color_name?: string;
  size_name?: string;
  quantity: number;
  unit_price: number;
};

export type NewCartOrderInput = {
  customer_name: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  note?: string;
  delivery_charge: number;
  customer_user_id?: string | null;
  items: NewCartItemInput[];
};

/** Customer-facing: create a multi-item (cart) order header + its line items. */
export async function createCartOrder(input: NewCartOrderInput): Promise<{ order: Order; items: OrderItem[] }> {
  const itemsSubtotal = input.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const totalQty = input.items.reduce((s, it) => s + it.quantity, 0);
  const summaryName =
    input.items.length === 1
      ? input.items[0].product_name
      : `${input.items.length} designs (${input.items.map((i) => i.product_name).join(", ")})`;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customer_name,
      phone: normalizeBdPhone(input.phone),
      district: input.district,
      area: input.area,
      address: input.address,
      note: input.note ?? null,
      product_id: input.items.length === 1 ? input.items[0].product_id ?? null : null,
      product_name: summaryName,
      product_url: input.items.length === 1 ? input.items[0].product_url ?? null : null,
      color_name: input.items.length === 1 ? input.items[0].color_name ?? null : null,
      size_name: input.items.length === 1 ? input.items[0].size_name ?? null : null,
      quantity: totalQty,
      unit_price: input.items.length === 1 ? input.items[0].unit_price : 0,
      delivery_charge: input.delivery_charge,
      total_price: itemsSubtotal + input.delivery_charge,
      is_multi_item: input.items.length > 1,
      customer_user_id: input.customer_user_id ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (orderErr) throw orderErr;

  const itemRows = input.items.map((it, idx) => ({
    order_id: order.id,
    product_id: it.product_id ?? null,
    product_name: it.product_name,
    product_url: it.product_url ?? null,
    color_name: it.color_name ?? null,
    size_name: it.size_name ?? null,
    quantity: it.quantity,
    unit_price: it.unit_price,
    subtotal: it.unit_price * it.quantity,
    sort_order: idx,
  }));
  const { data: items, error: itemsErr } = await supabase.from("order_items").insert(itemRows).select("*");
  if (itemsErr) throw itemsErr;

  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

/** Fetch the line items for one order (multi-item orders only). */
export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as OrderItem[];
}

/** Admin-only: list all orders, newest first. */
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

/** Customer-facing: list the signed-in customer's own orders (RLS-scoped). */
export async function fetchMyOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Admin-only: correct the delivery charge on an order (e.g. actual courier rate differed).
 * Recalculates total_price so the customer's "My Orders" tracking always shows the right total. */
export async function updateOrderDeliveryCharge(id: string, deliveryCharge: number): Promise<void> {
  const { data: existing, error: fetchErr } = await supabase
    .from("orders")
    .select("unit_price, quantity")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;
  const subtotal = Number(existing.unit_price) * Number(existing.quantity);
  const { error } = await supabase
    .from("orders")
    .update({ delivery_charge: deliveryCharge, total_price: subtotal + deliveryCharge })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

/** Subscribe to new/changed orders in real time. Returns an unsubscribe function. */
export function subscribeOrders(onChange: () => void): () => void {
  const channel = supabase
    .channel("orders-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Builds the pre-filled WhatsApp message text for a confirmed/created order. */
export function buildWhatsappMessage(order: Order): string {
  // Our note field is stored as "Delivery Zone: X — Spin Discount: -Y% — actual note",
  // so split those back apart here for a cleaner, separate display.
  let zoneLine: string | null = null;
  let spinLine: string | null = null;
  let noteLine: string | null = order.note ?? null;
  if (noteLine?.startsWith("Delivery Zone:")) {
    const parts = noteLine.split(" — ");
    zoneLine = parts[0].replace("Delivery Zone:", "").trim();
    const rest = parts.slice(1);
    if (rest[0]?.startsWith("Spin Discount:")) {
      spinLine = rest[0].replace("Spin Discount:", "").trim();
      noteLine = rest.slice(1).join(" — ").trim() || null;
    } else {
      noteLine = rest.join(" — ").trim() || null;
    }
  }

  const lines = [
    "🛍️ *ZYVRO — NEW ORDER*",
    "━━━━━━━━━━━━━━━",
    `Order ID: *${order.order_no}*`,
    "",
    "📦 *Product*",
    order.product_name,
    [order.color_name, order.size_name, `Qty: ${order.quantity}`].filter(Boolean).join("   |   "),
    order.product_url ? `Link: ${order.product_url}` : null,
    "",
    "💰 *Payment*",
    spinLine ? `🎉 Spin Discount: ${spinLine} applied` : null,
    `Unit Price: ৳${order.unit_price}`,
    `Delivery Charge: ৳${order.delivery_charge}`,
    `*Total: ৳${order.total_price}*`,
    "",
    "📍 *Delivery Details*",
    order.customer_name,
    order.phone,
    zoneLine ? `${order.area}, ${zoneLine}` : `${order.area}, ${order.district}`,
    order.address,
    noteLine ? `📝 Note: ${noteLine}` : null,
    "",
    "━━━━━━━━━━━━━━━",
    `✅ *To confirm:* please pay only the delivery charge (৳${order.delivery_charge}) in advance via bKash/Nagad — the product price is Cash on Delivery.`,
    "",
    "🙏 Please confirm my order. Thank you — ZYVRO 🖤",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

/** Builds the pre-filled WhatsApp message text for a multi-item cart order. */
export function buildWhatsappMessageMulti(order: Order, items: OrderItem[]): string {
  let zoneLine: string | null = null;
  let spinLine: string | null = null;
  let noteLine: string | null = order.note ?? null;
  if (noteLine?.startsWith("Delivery Zone:")) {
    const parts = noteLine.split(" — ");
    zoneLine = parts[0].replace("Delivery Zone:", "").trim();
    const rest = parts.slice(1);
    if (rest[0]?.startsWith("Spin Discount:")) {
      spinLine = rest[0].replace("Spin Discount:", "").trim();
      noteLine = rest.slice(1).join(" — ").trim() || null;
    } else {
      noteLine = rest.join(" — ").trim() || null;
    }
  }

  const itemsSubtotal = items.reduce((s, it) => s + it.subtotal, 0);

  const lines = [
    "🛍️ *ZYVRO — NEW ORDER*",
    "━━━━━━━━━━━━━━━",
    `Order ID: *${order.order_no}*`,
    "",
    `📦 *${items.length} Item${items.length > 1 ? "s" : ""}*`,
    ...items.flatMap((it, i) => [
      `${i + 1}. ${it.product_name}`,
      [it.color_name, it.size_name, `Qty: ${it.quantity}`].filter(Boolean).join("   |   "),
      `   ৳${it.unit_price} × ${it.quantity} = ৳${it.subtotal}`,
      it.product_url ? `   Link: ${it.product_url}` : null,
    ]),
    "",
    "💰 *Payment*",
    spinLine ? `🎉 Spin Discount: ${spinLine} applied` : null,
    `Items Subtotal: ৳${itemsSubtotal}`,
    `Delivery Charge: ৳${order.delivery_charge}`,
    `*Total: ৳${order.total_price}*`,
    "",
    "📍 *Delivery Details*",
    order.customer_name,
    order.phone,
    zoneLine ? `${order.area}, ${zoneLine}` : `${order.area}, ${order.district}`,
    order.address,
    noteLine ? `📝 Note: ${noteLine}` : null,
    "",
    "━━━━━━━━━━━━━━━",
    `✅ *To confirm:* please pay only the delivery charge (৳${order.delivery_charge}) in advance via bKash/Nagad — the product price is Cash on Delivery.`,
    "",
    "🙏 Please confirm my order. Thank you — ZYVRO 🖤",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
