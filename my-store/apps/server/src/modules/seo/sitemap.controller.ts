/**
 * Sitemap controller – serves /sitemap.xml with product and category URLs.
 */
import type { Request, Response } from "express";
import { getProductsList } from "../product/products-list.service";
import { getCategoriesList } from "../product/categories.service";
import { generateSitemapXML, buildSitemapUrls } from "../../shared/utils/sitemap";
import { env } from "@my-store/env/server";

function getBaseUrl(): string {
  const fromEnv = process.env.SITEMAP_BASE_URL;
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
  const firstOrigin = env.CORS_ORIGIN?.[0];
  if (firstOrigin) return firstOrigin.replace(/\/$/, "");
  return "https://mavrykpremium.store";
}

export async function getSitemap(_req: Request, res: Response): Promise<void> {
  try {
    const [products, categories] = await Promise.all([
      getProductsList(),
      getCategoriesList(),
    ]);

    const baseUrl = getBaseUrl();
    const urls = buildSitemapUrls(products, categories, baseUrl);
    const xml = generateSitemapXML(urls);

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).setHeader("Content-Type", "text/plain").send("Error generating sitemap");
  }
}
