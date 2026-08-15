import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, updateCartQuantity, removeFromCart } from "@/lib/cart";
import { formatPrice } from "@/lib/settings";
import { useActiveSpinOffer, applySpinDiscount } from "@/lib/spin";
import { CartCheckoutModal } from "@/components/CartCheckoutModal";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items } = useCart();
  const { offer } = useActiveSpinOffer();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!open) return null;

  const priceOf = (unitPrice: number) => (offer ? applySpinDiscount(unitPrice, offer.percent) : unitPrice);
  const subtotal = items.reduce((s, i) => s + priceOf(i.unitPrice) * i.quantity, 0);

  return (
    <>
      <div className="fixed inset-0 z-[80]">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-white/10 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-display text-lg tracked-wide flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[color:var(--gold-bright)]" /> Your Cart
            </h2>
            <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 grid place-items-center text-center px-6">
              <div>
                <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground mb-6">Your cart is empty.</p>
                <Link to="/shop" onClick={onClose} className="btn-zy-outline !py-2.5 !px-6">
                  Browse the Collection
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3 px-5 py-4">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="h-20 w-16 object-contain bg-black/30 border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/product/$slug"
                        params={{ slug: item.slug }}
                        onClick={onClose}
                        className="font-display text-sm tracked-wide truncate block hover:text-[color:var(--gold-bright)]"
                      >
                        {item.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {[item.colorName, item.sizeName].filter(Boolean).join("  |  ")}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-white/15">
                          <button
                            onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                            className="h-7 w-7 grid place-items-center hover:bg-white/5"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                            className="h-7 w-7 grid place-items-center hover:bg-white/5"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[color:var(--gold-bright)] text-sm">
                          {formatPrice(priceOf(item.unitPrice) * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 px-5 py-4 space-y-3">
                {offer && (
                  <div className="text-[11px] text-[color:var(--gold-bright)]">
                    🎉 {offer.percent}% Spin Discount applied to every item
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-display text-base text-[color:var(--gold-bright)]">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Delivery charge calculated at checkout.</p>
                <button onClick={() => setCheckoutOpen(true)} className="btn-zy w-full !py-3.5">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <CartCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => {
          setCheckoutOpen(false);
          onClose();
        }}
      />
    </>
  );
}
