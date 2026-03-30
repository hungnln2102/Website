import {
  deriveProductSeo,
  extractProductSeoTagTexts,
  normalizeProductSeoText,
  stripFirstProductSeoH1,
} from "./product-seo";

export type SeoAuditCheck = {
  label: string;
  detail: string;
  ready: boolean;
  weight: number;
};

export type SeoAuditLevel = "critical" | "warning" | "good" | "excellent";

export type ProductSeoAuditResult = {
  source: "website-render";
  passThreshold: number;
  checks: SeoAuditCheck[];
  score: number;
  level: SeoAuditLevel;
  readyCount: number;
  heading: string;
  slug: string;
  shortDescription: string;
  descriptionPlainText: string;
  rulesPlainText: string;
  titlePreview: string;
  metaPreview: string;
  imageAlt: string;
};

type AuditProductSeoParams = {
  shortDesc?: string | null;
  descriptionHtml?: string | null;
  rulesHtml?: string | null;
};

const PASS_THRESHOLD = 93;

const getSeoLevel = (score: number): SeoAuditLevel => {
  if (score >= PASS_THRESHOLD) return "excellent";
  if (score >= 85) return "good";
  if (score >= 70) return "warning";
  return "critical";
};

const getIntroText = (descriptionHtml: string, descriptionText: string): string => {
  const paragraphs = extractProductSeoTagTexts(descriptionHtml, "p");
  const firstParagraph = paragraphs[0];
  if (firstParagraph) {
    return firstParagraph;
  }
  return descriptionText.slice(0, 220).trim();
};

const hasStructuredRules = (rulesHtml: string): boolean =>
  /<(ul|ol|blockquote|h2|h3)\b/i.test(rulesHtml || "") &&
  /<li\b|<blockquote\b|<h2\b|<h3\b/i.test(rulesHtml || "");

export const auditProductSeo = ({
  shortDesc,
  descriptionHtml,
  rulesHtml,
}: AuditProductSeoParams): ProductSeoAuditResult => {
  const seo = deriveProductSeo({ shortDesc, descriptionHtml, rulesHtml });
  const sourceDescriptionHtml = String(descriptionHtml || "").trim();
  const sourceRulesHtml = String(rulesHtml || "").trim();
  const descriptionPlainText = normalizeProductSeoText(
    stripFirstProductSeoH1(sourceDescriptionHtml) || sourceDescriptionHtml
  );
  const rulesPlainText = normalizeProductSeoText(sourceRulesHtml);
  const h1Texts = extractProductSeoTagTexts(sourceDescriptionHtml, "h1");
  const h2Texts = extractProductSeoTagTexts(sourceDescriptionHtml, "h2");
  const introText = getIntroText(sourceDescriptionHtml, descriptionPlainText);
  const headingLength = seo.heading.length;
  const titleLength = seo.title.length;
  const metaLength = seo.metaDescription.length;
  const slugValid =
    seo.slug.length >= 8 &&
    seo.slug.length <= 80 &&
    /^[a-z0-9-]+$/.test(seo.slug);
  const imageAltValid = seo.imageAlt.length >= 15 && seo.imageAlt.length <= 120;
  const clearHeading =
    headingLength >= 20 &&
    headingLength <= 70 &&
    normalizeProductSeoText(seo.heading).split(" ").length >= 3;

  const checks: SeoAuditCheck[] = [
    {
      label: "Meta description",
      detail:
        metaLength >= 140 && metaLength <= 160
          ? `short_desc đang ở ${metaLength} ký tự, đủ cho meta description.`
          : "short_desc nên dài 140-160 ký tự để Website render meta description.",
      ready: metaLength >= 140 && metaLength <= 160,
      weight: 10,
    },
    {
      label: "Nguồn H1",
      detail:
        h1Texts.length === 1
          ? "description có đúng 1 thẻ H1 để Website render heading chính."
          : "description phải có đúng 1 thẻ H1 làm heading chính.",
      ready: h1Texts.length === 1,
      weight: 10,
    },
    {
      label: "Độ rõ của H1",
      detail: clearHeading
        ? `H1 dài ${headingLength} ký tự và đủ rõ intent cho trang chi tiết.`
        : "H1 nên dài 20-70 ký tự và có ít nhất 3 từ rõ nghĩa.",
      ready: clearHeading,
      weight: 10,
    },
    {
      label: "Cấu trúc H2",
      detail:
        h2Texts.length >= 2 && h2Texts.length <= 5
          ? `description đang có ${h2Texts.length} H2, đủ section cho bài SEO.`
          : "description nên có 2-5 H2 để Website render body chuẩn section.",
      ready: h2Texts.length >= 2 && h2Texts.length <= 5,
      weight: 10,
    },
    {
      label: "Độ dài body",
      detail:
        descriptionPlainText.length >= 600 &&
        descriptionPlainText.length <= 3000
          ? `body đang dài ${descriptionPlainText.length} ký tự sau khi render.`
          : "body sau khi render nên dài 600-3000 ký tự.",
      ready:
        descriptionPlainText.length >= 600 &&
        descriptionPlainText.length <= 3000,
      weight: 10,
    },
    {
      label: "Đoạn mở bài",
      detail:
        introText.length >= 80
          ? `đoạn mở bài đang dài ${introText.length} ký tự.`
          : "đoạn mở bài đầu tiên nên dài tối thiểu 80 ký tự.",
      ready: introText.length >= 80,
      weight: 10,
    },
    {
      label: "Độ dài rules",
      detail:
        rulesPlainText.length >= 80 && rulesPlainText.length <= 1800
          ? `rules đang dài ${rulesPlainText.length} ký tự.`
          : "rules nên dài 80-1800 ký tự để render thành khối phụ trợ.",
      ready: rulesPlainText.length >= 80 && rulesPlainText.length <= 1800,
      weight: 10,
    },
    {
      label: "Cấu trúc rules",
      detail: hasStructuredRules(sourceRulesHtml)
        ? "rules đã có list, heading hoặc blockquote để Website render rõ ràng."
        : "rules nên có list, heading hoặc blockquote.",
      ready: hasStructuredRules(sourceRulesHtml),
      weight: 10,
    },
    {
      label: "SEO title",
      detail:
        titleLength >= 45 && titleLength <= 65
          ? `title render đang dài ${titleLength} ký tự.`
          : "title render nên dài 45-65 ký tự.",
      ready: titleLength >= 45 && titleLength <= 65,
      weight: 10,
    },
    {
      label: "Slug render",
      detail: slugValid
        ? `slug \`${seo.slug}\` hợp lệ để Website dùng làm URL.`
        : "slug phải dài 8-80 ký tự và chỉ gồm chữ thường, số, dấu gạch ngang.",
      ready: slugValid,
      weight: 5,
    },
    {
      label: "Alt hình ảnh",
      detail: imageAltValid
        ? "image alt đủ độ dài để dùng cho gallery/schema."
        : "image alt nên dài 15-120 ký tự.",
      ready: imageAltValid,
      weight: 5,
    },
  ];

  const score = checks.reduce(
    (total, check) => total + (check.ready ? check.weight : 0),
    0
  );

  return {
    source: "website-render",
    passThreshold: PASS_THRESHOLD,
    checks,
    score,
    level: getSeoLevel(score),
    readyCount: checks.filter((check) => check.ready).length,
    heading: seo.heading,
    slug: seo.slug,
    shortDescription: seo.shortDescription,
    descriptionPlainText,
    rulesPlainText,
    titlePreview: seo.title,
    metaPreview: seo.metaDescription,
    imageAlt: seo.imageAlt,
  };
};
