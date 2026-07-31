import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2, MessageCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { fetchAppSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/settings";
import { createOrder, buildWhatsappMessage, whatsappUrl, type Order } from "@/lib/orders";
import { supabase } from "@/integrations/supabase/client";

type OrderModalProps = {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    url: string;
    colorName?: string | null;
    sizeName?: string | null;
    unitPrice: number;
  };
};

type DeliveryZone = "dhaka" | "dhaka_sub" | "outside";

export function OrderModal({ open, onClose, product }: OrderModalProps) {
  const { data: settings } = useQuery({ queryKey: ["app-settings"], queryFn: fetchAppSettings });

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [zone, setZone] = useState<DeliveryZone>("dhaka");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    district: "",
    area: "",
    address: "",
    note: "",
    quantity: 1,
  });

  if (!open) return null;

  const deliveryCharge =
    zone === "dhaka"
      ? settings?.delivery_charge_dhaka ?? 80
      : zone === "dhaka_sub"
        ? settings?.delivery_charge_dhaka_sub ?? 100
        : settings?.delivery_charge_outside_dhaka ?? 130;
  const zoneLabel = zone === "dhaka" ? "Dhaka City" : zone === "dhaka_sub" ? "Dhaka Sub-area" : "Outside Dhaka";
  const subtotal = product.unitPrice * form.quantity;
  const total = subtotal + deliveryCharge;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goToSummary(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.district.trim() || !form.area.trim() || !form.address.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep(2);
  }

  async function confirmOrder() {
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const order: Order = await createOrder({
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        district: form.district.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        note: [`Delivery Zone: ${zoneLabel}`, form.note.trim()].filter(Boolean).join(" — "),
        product_id: product.id,
        product_name: product.name,
        product_url: product.url,
        color_name: product.colorName ?? undefined,
        size_name: product.sizeName ?? undefined,
        quantity: form.quantity,
        unit_price: product.unitPrice,
        delivery_charge: deliveryCharge,
        total_price: total,
        customer_user_id: userData.user?.id ?? null,
      });

      const number = settings?.whatsapp_number || "8801577142710";
      const message = buildWhatsappMessage(order);
      window.open(whatsappUrl(number, message), "_blank", "noopener,noreferrer");

      toast.success("Order saved — please press Send in WhatsApp to confirm.");
      onClose();
      setStep(1);
      setForm({ name: "", phone: "", district: "", area: "", address: "", note: "", quantity: 1 });
      setZone("dhaka");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-white/10 shadow-2xl">
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} aria-label="Back" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="font-display text-lg tracked-wide flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[color:var(--gold-bright)]" />
              {step === 1 ? "Delivery Details" : "Order Summary"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 && (
          <form onSubmit={goToSummary} className="px-6 py-6 space-y-4">
            <Field label="Delivery Zone *">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["dhaka", "Dhaka City"],
                    ["dhaka_sub", "Dhaka Sub-area"],
                    ["outside", "Outside Dhaka"],
                  ] as [DeliveryZone, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setZone(value)}
                    className={`px-2 py-2 text-[11px] tracked-wide border transition ${
                      zone === value
                        ? "border-[color:var(--gold)] text-[color:var(--gold-bright)] bg-[color:var(--gold)]/10"
                        : "border-white/10 text-muted-foreground hover:border-white/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Full Name *">
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="input-zy"
                placeholder="Your name"
              />
            </Field>
            <Field label="Phone Number *">
              <input
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input-zy"
                placeholder="01XXXXXXXXX"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="District *">
                <input
                  required
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                  className="input-zy"
                  placeholder="Dhaka"
                />
              </Field>
              <Field label="Area *">
                <input
                  required
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  className="input-zy"
                  placeholder="Mirpur"
                />
              </Field>
            </div>
            <Field label="Full Address *">
              <textarea
                required
                rows={2}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="input-zy resize-none"
                placeholder="House, road, area details"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4 items-end">
              <Field label="Quantity">
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => update("quantity", Math.max(1, Number(e.target.value) || 1))}
                  className="input-zy"
                />
              </Field>
              <Field label="Order Note (optional)">
                <input
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  className="input-zy"
                  placeholder="Any note"
                />
              </Field>
            </div>
            <button type="submit" className="btn-zy w-full !py-3.5 mt-2">
              Continue to Summary
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="px-6 py-6 space-y-5">
            <div className="border border-white/10 bg-black/30 p-4 space-y-2 text-sm">
              <SummaryRow label="Product" value={product.name} />
              {product.colorName && <SummaryRow label="Color" value={product.colorName} />}
              {product.sizeName && <SummaryRow label="Size" value={product.sizeName} />}
              <SummaryRow label="Quantity" value={String(form.quantity)} />
              <SummaryRow label="Delivery Zone" value={zoneLabel} />
              <div className="h-px bg-white/10 my-2" />
              <SummaryRow label="Unit Price" value={formatPrice(product.unitPrice)} />
              <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
              <SummaryRow label="Delivery Charge" value={formatPrice(deliveryCharge)} />
              <div className="h-px bg-white/10 my-2" />
              <SummaryRow label="Total" value={formatPrice(total)} bold />
            </div>

            <div className="border border-white/10 bg-black/20 p-4 space-y-1 text-xs text-muted-foreground">
              <div>{form.name} · {form.phone}</div>
              <div>{form.area}, {form.district}</div>
              <div className="text-foreground/70">{form.address}</div>
              {form.note && <div className="italic">Note: {form.note}</div>}
            </div>

            <div className="border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 p-3 text-xs text-[color:var(--gold-bright)]">
              📌 To confirm this order, please pay only the delivery charge ({formatPrice(deliveryCharge)}) in advance via bKash/Nagad — the product price is Cash on Delivery. Our team will share payment details on WhatsApp.
            </div>

            <button
              onClick={confirmOrder}
              disabled={submitting}
              className="btn-zy w-full !py-3.5 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" /> Confirm & Send via WhatsApp
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-muted-foreground">
              WhatsApp will open with your order pre-filled — just press Send to confirm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs tracked-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-display text-base" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "text-[color:var(--gold-bright)]" : "text-foreground"}>{value}</span>
    </div>
  );
}
