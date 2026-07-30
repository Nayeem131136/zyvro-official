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
  steadfast_consignment_id: string | null;
  steadfast_tracking_code: string | null;
  steadfast_status: string | null;
  created_at: string;
  updated_at: string;
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
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({ ...input, status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Order;
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
  const lines = [
    "🛒 *NEW ORDER REQUEST — ZYVRO*",
    "",
    `Order ID: ${order.order_no}`,
    `Product: ${order.product_name}`,
    order.product_url ? `Product Link: ${order.product_url}` : null,
    order.color_name ? `Color: ${order.color_name}` : null,
    order.size_name ? `Size: ${order.size_name}` : null,
    `Quantity: ${order.quantity}`,
    "",
    `Unit Price: ৳${order.unit_price}`,
    `Delivery Charge: ৳${order.delivery_charge}`,
    `Total: ৳${order.total_price}`,
    "",
    `Customer Name: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `District: ${order.district}`,
    `Area: ${order.area}`,
    `Full Address: ${order.address}`,
    order.note ? `Order Note: ${order.note}` : null,
    "",
    "Please confirm my order. Thank you.",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
