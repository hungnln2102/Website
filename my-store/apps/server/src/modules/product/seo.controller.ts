import type { Request, Response } from "express";
import { auditProductSeo } from "../utils/product-seo-audit";

export async function auditProductSeoHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { shortDesc, descriptionHtml, rulesHtml } = req.body ?? {};

    const result = auditProductSeo({
      shortDesc: typeof shortDesc === "string" ? shortDesc : "",
      descriptionHtml: typeof descriptionHtml === "string" ? descriptionHtml : "",
      rulesHtml: typeof rulesHtml === "string" ? rulesHtml : "",
    });

    res.json({ data: result });
  } catch (error) {
    console.error("Product SEO audit error:", error);
    res.status(500).json({ error: "Failed to audit product SEO" });
  }
}
