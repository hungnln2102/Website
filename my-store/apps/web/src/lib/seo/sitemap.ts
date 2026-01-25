/**
 * Dynamic sitemap generation
 */

import { APP_CONFIG } from "@/lib/constants";
import type { ProductDto } from "@/lib/api";
import type { CategoryDto } from "@/lib/api";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Generate sitemap XML
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map((url) => {
    const lastmod = url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : "";
    const changefreq = url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : "";
    const priority = url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : "";
    
    return `  <url>\n    <loc>${url.loc}</loc>\n${lastmod}${changefreq}${priority}  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap URLs from products and categories
 */
export function generateSitemapUrls(
  products: ProductDto[],
  categories: CategoryDto[],
  baseUrl: string = APP_CONFIG.url
): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: baseUrl,
    changefreq: "daily",
    priority: 1.0,
  });

  // Product pages
  products.forEach((product) => {
    urls.push({
      loc: `${baseUrl}/${encodeURIComponent(product.slug)}`,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: new Date().toISOString().split("T")[0],
    });
  });

  // Category pages (if you have category pages)
  categories.forEach((category) => {
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, "-");
    urls.push({
      loc: `${baseUrl}/category/${encodeURIComponent(categorySlug)}`,
      changefreq: "weekly",
      priority: 0.7,
    });
  });

  return urls;
}

/**
 * Generate and save sitemap (for server-side generation)
 * This would typically be called during build or via API route
 */
export async function generateAndSaveSitemap(
  products: ProductDto[],
  categories: CategoryDto[],
  outputPath: string = "/public/sitemap.xml"
): Promise<string> {
  const urls = generateSitemapUrls(products, categories);
  const xml = generateSitemapXML(urls);
  
  // In a real implementation, you would write this to a file
  // For client-side, we can create a download or use an API endpoint
  return xml;
}
