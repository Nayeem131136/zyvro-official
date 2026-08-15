import { useSyncExternalStore } from "react";

export type CartItem = {
  key: string; // productId + colorId + sizeId — unique per line
  productId: string;
  name: string;
  slug: string;
  thumbnail: string;
  colorName: string | null;
  sizeName: string | null;
  /** Regular (pre-spin-discount) unit price. Spin discount is applied live at checkout. */
  unitPrice: number;
  quantity: number;
};

const STORAGE_KEY = "zyvro_cart_v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("zyvro-cart-changed"));
}

let cache: CartItem[] = readCart();

function subscribe(callback: () => void) {
  const handler = () => {
    cache = readCart();
    callback();
  };
  window.addEventListener("zyvro-cart-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("zyvro-cart-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return cache;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = readCart();
  const existing = items.find((i) => i.key === item.key);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }
  writeCart(items);
}

export function updateCartQuantity(key: string, quantity: number) {
  let items = readCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.key !== key);
  } else {
    items = items.map((i) => (i.key === key ? { ...i, quantity } : i));
  }
  writeCart(items);
}

export function removeFromCart(key: string) {
  writeCart(readCart().filter((i) => i.key !== key));
}

export function clearCart() {
  writeCart([]);
}

/** Reactive hook — re-renders whenever the cart changes, in any component/tab. */
export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, count };
}
