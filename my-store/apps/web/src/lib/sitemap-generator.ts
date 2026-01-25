/**
 * Client-side sitemap generation utility
 * For production, this should be generated server-side or via build script
 */

import { generateSitemapXML, generateSitemapUrls } from "./seo/sitemap";
import { fetchProducts } from "./api";
import { fetchCategories } from "./api";
import { APP_CONFIG } from "./constants";

/**
 * Generate sitemap and download it
 */
export async function generateAndDownloadSitemap() {
  try {
    // Fetch products and categories
    const [products, categories] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]);

    // Generate sitemap URLs
    const urls = generateSitemapUrls(products, categories, APP_CONFIG.url);

    // Generate XML
    const xml = generateSitemapXML(urls);

    // Create blob and download
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitemap.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("[Sitemap] Generated and downloaded successfully");
  } catch (error) {
    console.error("[Sitemap] Failed to generate:", error);
    throw error;
  }
}

/**
 * Generate sitemap and return as string
 */
export async function generateSitemapString(): Promise<string> {
  try {
    const [products, categories] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]);

    const urls = generateSitemapUrls(products, categories, APP_CONFIG.url);
    return generateSitemapXML(urls);
  } catch (error) {
    console.error("[Sitemap] Failed to generate:", error);
    throw error;
  }
}
