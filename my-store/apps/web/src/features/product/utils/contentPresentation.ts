const PRODUCT_INTERNAL_PATTERNS = [
  /short_desc/i,
  /description\s*va\s*rules/i,
  /duoc\s*dong\s*bo\s*tu\s*short_desc/i,
  /se\s*duoc\s*lay\s*tu\s*short_desc/i,
  /noi dung chi tiet san pham/i,
];

export const PRODUCT_DESCRIPTION_FALLBACK =
  "Th\u00f4ng tin chi ti\u1ebft \u0111ang \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt. Vui l\u00f2ng li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3 \u0111\u1ec3 \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n g\u00f3i ph\u00f9 h\u1ee3p tr\u01b0\u1edbc khi thanh to\u00e1n.";

export const PURCHASE_POLICY_FALLBACK =
  "Vui l\u00f2ng ki\u1ec3m tra \u0111\u00fang g\u00f3i s\u1ea3n ph\u1ea9m, th\u1eddi h\u1ea1n s\u1eed d\u1ee5ng v\u00e0 th\u00f4ng tin nh\u1eadn h\u00e0ng tr\u01b0\u1edbc khi thanh to\u00e1n. N\u1ebfu c\u1ea7n h\u1ed7 tr\u1ee3 k\u00edch ho\u1ea1t ho\u1eb7c x\u1eed l\u00fd \u0111\u0103ng nh\u1eadp, \u0111\u1ed9i ng\u0169 h\u1ed7 tr\u1ee3 s\u1ebd ph\u1ea3n h\u1ed3i s\u1edbm nh\u1ea5t.";

export const META_DESCRIPTION_FALLBACK =
  "Th\u00f4ng tin chi ti\u1ebft s\u1ea3n ph\u1ea9m \u0111ang \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt. Li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3 \u0111\u1ec3 \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n g\u00f3i ph\u00f9 h\u1ee3p v\u1edbi nhu c\u1ea7u s\u1eed d\u1ee5ng.";

const normalizeContentText = (value?: string | null) =>
  (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isInternalProductPlaceholder = (value?: string | null) => {
  const normalized = normalizeContentText(value);
  if (!normalized) return true;

  return PRODUCT_INTERNAL_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const getCustomerFacingDescription = (value?: string | null) =>
  isInternalProductPlaceholder(value)
    ? PRODUCT_DESCRIPTION_FALLBACK
    : normalizeContentText(value);

export const getCustomerFacingPolicy = (value?: string | null) =>
  isInternalProductPlaceholder(value)
    ? PURCHASE_POLICY_FALLBACK
    : normalizeContentText(value);
