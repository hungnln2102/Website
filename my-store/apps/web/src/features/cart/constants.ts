/** Cấu hình ngân hàng VietQR (chuyển khoản) */
export const CART_BANK_CONFIG = {
  bankId: "VBP",
  bankName: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VP Bank)",
  bankLogo: "https://api.vietqr.io/img/VPB.png",
  accountNo: "9183400998",
  accountName: "NGO LE NGOC HUNG",
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
