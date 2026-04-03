/**
 * URL ảnh từ img.vietqr.io — một mẫu duy nhất cho toàn site:
 * template "compact" (540×540): QR + logo VietQR + Napas + ngân hàng.
 * @see https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/api-tao-ma-qr/
 */
export const VIETQR_IMAGE_TEMPLATE = "compact" as const;

export interface VietQrImageUrlOptions {
  bankCode: string;
  accountNumber: string;
  amount?: number | null;
  /** Nội dung chuyển khoản (addInfo) */
  description?: string;
  accountName?: string;
}

export function buildVietQrImageUrl({
  accountNumber,
  bankCode,
  amount,
  description,
  accountName,
}: VietQrImageUrlOptions): string {
  const account = (accountNumber || "").trim();
  const bank = (bankCode || "").trim();
  if (!account || !bank) return "";

  const params = new URLSearchParams();
  const numericAmount = Number(amount);
  if (Number.isFinite(numericAmount) && numericAmount > 0) {
    params.set("amount", Math.round(numericAmount).toString());
  }
  const desc = (description || "").trim();
  if (desc) params.set("addInfo", desc);
  const name = (accountName || "").trim();
  if (name) params.set("accountName", name);

  const queryString = params.toString();
  return `https://img.vietqr.io/image/${bank}-${account}-${VIETQR_IMAGE_TEMPLATE}.png${
    queryString ? `?${queryString}` : ""
  }`;
}
