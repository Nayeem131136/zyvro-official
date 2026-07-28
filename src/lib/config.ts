export const WHATSAPP_NUMBER = "8801577142710";
export const BRAND = {
  name: "ZYVRO",
  tagline: "Own Your Style",
  est: "2026",
  origin: "Bangladesh",
  socials: {
    facebook: "https://facebook.com/zyvro.official",
    instagram: "https://instagram.com/zyvro.official",
    tiktok: "https://tiktok.com/@zyvro.official",
  },
};

export function whatsappOrderUrl(params: {
  productName: string;
  price: number | string;
  productUrl: string;
}) {
  const msg =
    `Hi ZYVRO! I'm interested in ordering:\n` +
    `🛒 Product: ${params.productName}\n` +
    `💰 Price: ৳${params.price}\n` +
    `🔗 Link: ${params.productUrl}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function whatsappGeneralUrl(text = "Hi ZYVRO! I have a question.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
