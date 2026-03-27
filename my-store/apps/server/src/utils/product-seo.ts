import { slugify, stripHtml } from "./product-helpers";

type DeriveProductSeoParams = {
  shortDesc?: string | null;
  descriptionHtml?: string | null;
  rulesHtml?: string | null;
  siteName?: string;
};

export type DerivedProductSeo = {
  heading: string;
  title: string;
  metaDescription: string;
  slug: string;
  shortDescription: string;
  excerpt: string;
  descriptionHtml: string;
  rulesHtml: string;
  imageAlt: string;
};

const DEFAULT_HEADING = "Chi tiết sản phẩm";
const DEFAULT_META =
  "Nội dung chi tiết sản phẩm sẽ được lấy từ short_desc, description và rules.";
const DEFAULT_SITE_NAME = "Mavryk Premium";

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCharCode(Number(code) || 0)
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCharCode(parseInt(code, 16) || 0)
    );

export const normalizeProductSeoText = (
  value: string | null | undefined
): string =>
  decodeHtmlEntities(stripHtml(value || ""))
    .replace(/\s+/g, " ")
    .trim();

const trimAtWord = (value: string, maxLength: number): string => {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;

  const clipped = normalized.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const safe = lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped.slice(0, maxLength);
  return `${safe.trim()}...`;
};

export const extractProductSeoTagTexts = (
  html: string,
  tagName: string
): string[] => {
  if (!html) return [];

  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const texts: string[] = [];
  let match: RegExpExecArray | null = regex.exec(html);

  while (match) {
    const text = normalizeProductSeoText(match[1] || "");
    if (text) texts.push(text);
    match = regex.exec(html);
  }

  return texts;
};

const extractHeading = (descriptionHtml: string): string => {
  const selectors = ["h1", "h2", "h3", "h4"];
  for (const selector of selectors) {
    const heading = extractProductSeoTagTexts(descriptionHtml, selector)[0];
    if (heading) return heading;
  }
  return "";
};

export const stripFirstProductSeoH1 = (html: string): string =>
  (html || "")
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, "")
    .trim();

const firstSentence = (value: string): string => {
  if (!value) return "";
  const match = value.match(/(.+?[.!?])(\s|$)/);
  return (match?.[1] || value).trim();
};

const fallbackHeading = (shortDescription: string, descriptionText: string): string => {
  const source = firstSentence(shortDescription) || firstSentence(descriptionText);
  if (!source) return DEFAULT_HEADING;
  return trimAtWord(source, 70);
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripRepeatedHeading = (source: string, heading: string): string => {
  const normalizedSource = source.trim();
  const normalizedHeading = heading.trim();
  if (!normalizedSource || !normalizedHeading) return normalizedSource;

  return normalizedSource
    .replace(new RegExp(`^${escapeRegex(normalizedHeading)}[\\s,:;.!?-]*`, "i"), "")
    .trim();
};

const buildTitleSupport = (
  heading: string,
  shortDescription: string,
  descriptionText: string
): string => {
  const candidates = [
    shortDescription,
    firstSentence(descriptionText),
    descriptionText,
  ];

  for (const candidate of candidates) {
    const stripped = stripRepeatedHeading(candidate, heading)
      .replace(/^[\s,:;.!?-]+/, "")
      .trim();

    if (!stripped) continue;

    const firstClause = stripped.split(/[.!?]/)[0]?.trim() || stripped;
    const compactClause = firstClause
      .split(/[,;:]/)
      .slice(0, 2)
      .join(", ")
      .trim();

    const support = compactClause || firstClause;
    if (support.length >= 8) return support;
  }

  return "";
};

const buildTitle = (
  heading: string,
  shortDescription: string,
  descriptionText: string,
  siteName: string
): string => {
  const normalizedHeading = heading.trim();
  if (!normalizedHeading) return siteName;

  const suffix = ` | ${siteName}`;
  const maxTitleLength = 65;
  const minTitleLength = 45;
  const maxBaseLength = Math.max(20, maxTitleLength - suffix.length);

  let base = normalizedHeading;

  if (`${base}${suffix}`.length < minTitleLength) {
    const support = buildTitleSupport(
      normalizedHeading,
      shortDescription,
      descriptionText
    );
    if (support) {
      base = trimAtWord(`${normalizedHeading} - ${support}`, maxBaseLength);
    }
  }

  if (base.length > maxBaseLength) {
    base = trimAtWord(base, maxBaseLength);
  }

  const titled = `${base}${suffix}`;
  if (titled.length <= maxTitleLength) return titled;

  return trimAtWord(base, maxTitleLength);
};

const buildMetaDescription = (
  shortDescription: string,
  descriptionText: string
): string => {
  const source = shortDescription || firstSentence(descriptionText) || descriptionText;
  if (!source) return DEFAULT_META;
  return trimAtWord(source, 160);
};

export const deriveProductSeo = ({
  shortDesc,
  descriptionHtml,
  rulesHtml,
  siteName = DEFAULT_SITE_NAME,
}: DeriveProductSeoParams): DerivedProductSeo => {
  const shortDescription = normalizeProductSeoText(shortDesc);
  const normalizedDescriptionHtml = String(descriptionHtml || "").trim();
  const normalizedRulesHtml = String(rulesHtml || "").trim();
  const descriptionText = normalizeProductSeoText(normalizedDescriptionHtml);
  const heading =
    extractHeading(normalizedDescriptionHtml) ||
    fallbackHeading(shortDescription, descriptionText);
  const slug =
    slugify(heading) ||
    slugify(shortDescription) ||
    slugify(descriptionText) ||
    "chi-tiet-san-pham";
  const metaDescription = buildMetaDescription(shortDescription, descriptionText);
  const descriptionBodyHtml =
    stripFirstProductSeoH1(normalizedDescriptionHtml) || normalizedDescriptionHtml;

  return {
    heading,
    title: buildTitle(heading, shortDescription, descriptionText, siteName),
    metaDescription,
    slug,
    shortDescription,
    excerpt: metaDescription,
    descriptionHtml: descriptionBodyHtml,
    rulesHtml: normalizedRulesHtml,
    imageAlt: trimAtWord(heading || metaDescription, 120),
  };
};
