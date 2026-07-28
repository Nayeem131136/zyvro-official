// TODO: update this to your real production domain once you deploy
// (e.g. your Vercel URL or custom domain like https://zyvro.com.bd)
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://zyvro-official.vercel.app";

export function abs(path: string) {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
