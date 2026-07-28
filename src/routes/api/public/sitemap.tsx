import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

async function buildSitemap(): Promise<string> {
  const staticPaths = ["/", "/shop", "/about", "/contact"];
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  const now = new Date().toISOString();
  const entries: string[] = [
    ...staticPaths.map((p) => urlEntry(`${SITE_URL}${p}`, now, p === "/" ? "1.0" : "0.7")),
    ...(products ?? []).map((p) =>
      urlEntry(`${SITE_URL}/product/${p.slug}`, p.updated_at ?? now, "0.8"),
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}

function urlEntry(loc: string, lastmod: string, priority: string) {
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
}

export const Route = createFileRoute("/api/public/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildSitemap();
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (e) {
          return new Response(
            `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`,
            { status: 200, headers: { "Content-Type": "application/xml" } },
          );
        }
      },
    },
  },
});
