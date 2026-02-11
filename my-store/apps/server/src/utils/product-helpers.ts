/**
 * Helpers used by product/category listing and detail APIs.
 */

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const stripHtml = (value: string | null): string => {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

export const toNumber = (value: unknown): number => {
  if (typeof value === "bigint") return Number(value);
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const resolveImageUrl = (url: string | null): string => {
  if (!url) return "https://placehold.co/600x400?text=No+Image";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = process.env.IMAGE_BASE_URL || "";
  if (base) return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  return url;
};
