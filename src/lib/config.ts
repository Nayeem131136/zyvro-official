export const WHATSAPP_NUMBER = "8801577142710"; // fallback default; live value comes from Admin > Settings

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

export function whatsappGeneralUrl(text = "Hi ZYVRO! I have a question.", number: string = WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
