import { apiFetch, getApiBase } from "@/lib/api/client";

export type PublicBannerRow = {
  id: number;
  image_url: string;
  title: string;
  description: string;
  tag_text: string;
  image_alt: string;
  button_label: string | null;
  button_href: string | null;
  sort_order: number;
};

export type BannerSlide = {
  title: string;
  description: string;
  tagText: string;
  cta: string;
  href: string | null;
  imageSrc: string;
  imageAlt: string;
  /** Tùy chọn (responsive srcset); banner từ DB thường chỉ có một URL. */
  imageSrcSet?: string;
};

export function mapPublicBannerRow(row: PublicBannerRow): BannerSlide {
  const href = row.button_href?.trim() || null;
  const ctaRaw = row.button_label?.trim() || "";
  const cta = href ? ctaRaw : "";
  const tag = row.tag_text?.trim();
  return {
    title: row.title,
    description: row.description?.trim() || "",
    tagText: tag || "Ưu đãi đặc biệt",
    cta,
    href,
    imageSrc: row.image_url.trim(),
    imageAlt: row.image_alt?.trim() || row.title,
  };
}

/** Banner trang chủ từ admin_orderlist (content.banners). */
export async function fetchActiveHomeBanners(): Promise<BannerSlide[]> {
  const base = getApiBase().replace(/\/+$/, "");
  const url = `${base}/api/public/content/banners`;
  const res = await apiFetch(url, undefined, 15_000);
  if (!res.ok) {
    throw new Error("Không tải được banner.");
  }
  const data = (await res.json()) as { items: PublicBannerRow[] };
  const items = data.items || [];
  return items.map(mapPublicBannerRow);
}
