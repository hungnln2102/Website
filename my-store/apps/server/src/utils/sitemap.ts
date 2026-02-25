/**
 * Server-side sitemap XML generation.
 * Uses same URL structure as web app (product slug, category slug).
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      const lastmod = url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : "";
      const changefreq = url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : "";
      const priority = url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : "";
      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n${lastmod}${changefreq}${priority}  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type ProductRow = { slug: string; name?: string };
export type CategoryRow = { id: number; name: string };

export function buildSitemapUrls(
  products: ProductRow[],
  categories: CategoryRow[],
  baseUrl: string
): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  const today = new Date().toISOString().split("T")[0];

  urls.push({
    loc: baseUrl.replace(/\/$/, ""),
    changefreq: "daily",
    priority: 1.0,
  });

  for (const product of products) {
    urls.push({
      loc: `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(product.slug)}`,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: today,
    });
  }

  for (const category of categories) {
    const categorySlug = slugifyCategory(category.name);
    urls.push({
      loc: `${baseUrl.replace(/\/$/, "")}/category/${encodeURIComponent(categorySlug)}`,
      changefreq: "weekly",
      priority: 0.7,
    });
  }

  return urls;
}
