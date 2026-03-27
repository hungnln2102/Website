const PRODUCT_INTERNAL_PATTERNS = [
  /short_desc/i,
  /description\s*va\s*rules/i,
  /duoc\s*dong\s*bo\s*tu\s*short_desc/i,
  /se\s*duoc\s*lay\s*tu\s*short_desc/i,
  /noi dung chi tiet san pham/i,
];

export const PRODUCT_DESCRIPTION_FALLBACK =
  "Thông tin chi tiết đang được cập nhật. Vui lòng liên hệ hỗ trợ để được tư vấn gói phù hợp trước khi thanh toán.";

export const PURCHASE_POLICY_FALLBACK =
  "Vui lòng kiểm tra đúng gói sản phẩm, thời hạn sử dụng và thông tin nhận hàng trước khi thanh toán. Nếu cần hỗ trợ kích hoạt hoặc xử lý đăng nhập, đội ngũ hỗ trợ sẽ phản hồi sớm nhất.";

export const META_DESCRIPTION_FALLBACK =
  "Thông tin chi tiết sản phẩm đang được cập nhật. Liên hệ hỗ trợ để được tư vấn gói phù hợp với nhu cầu sử dụng.";

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
