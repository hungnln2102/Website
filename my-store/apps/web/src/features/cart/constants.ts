/** Cấu hình ngân hàng VietQR (chuyển khoản) */
export const CART_BANK_CONFIG = {
  /** Mã ngân hàng VietQR (VD: VPB, hoặc BIN 6 số tùy img.vietqr.io) */
  bankId: import.meta.env.VITE_BANK_ID || "VPB",
  bankName:
    import.meta.env.VITE_BANK_NAME ||
    "Ngân hàng TMCP Việt Nam Thịnh Vượng (VP Bank)",
  bankLogo: `https://api.vietqr.io/img/${import.meta.env.VITE_BANK_ID || "VPB"}.png`,
  accountNo: import.meta.env.VITE_BANK_ACCOUNT_NO || "",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "",
} as const;

export const PAYMENT_TIMEOUT_SECONDS = 15 * 60; // 15 phút
export const SUCCESS_REDIRECT_SECONDS = 5;

export const formatPaymentCurrency = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

export const formatPaymentTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
