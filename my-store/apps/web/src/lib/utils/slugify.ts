/**
 * Converts a string to a URL-friendly slug
 * @param value - The string to slugify
 * @returns A URL-friendly slug string
 */
export const slugify = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
