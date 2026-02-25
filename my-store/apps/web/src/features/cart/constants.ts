/** Cấu hình ngân hàng VietQR (chuyển khoản) */
export const CART_BANK_CONFIG = {
  bankId: "ACB",
  bankName: "Ngân hàng Á Châu (ACB)",
  bankLogo: "https://api.vietqr.io/img/ACB.png",
  accountNo: "46282537",
  accountName: "NGUYEN THI THU TRANG",
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
