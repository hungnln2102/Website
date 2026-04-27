import vpbankLogoUrl from "@/assets/banks/vpbank.svg?url";

/**
 * Logo VPBank: import qua Vite (`?url`) để build production / base path luôn đúng
 * (file trong `public/` dễ 404 tùy cấu hình host).
 * Mã NAPAS BIN 970432 = VPBank (VietQR).
 */
const bankId = String(import.meta.env.VITE_BANK_ID || "VPB").trim();

const isVpBankId = (id: string) => {
  const u = id.toUpperCase();
  return u === "VPB" || u === "970432" || u === "VPBANK";
};

const defaultBankLogo = () =>
  isVpBankId(bankId)
    ? vpbankLogoUrl
    : `https://cdn.vietqr.io/img/${encodeURIComponent(bankId)}.png`;

/** Cấu hình ngân hàng VietQR (chuyển khoản) */
export const CART_BANK_CONFIG = {
  /** Mã ngân hàng VietQR (VD: VPB) */
  bankId,
  bankName:
    import.meta.env.VITE_BANK_NAME ||
    "Ngân hàng TMCP Việt Nam Thịnh Vượng (VP Bank)",
  /** Ghi đè bằng VITE_BANK_LOGO nếu cần; VPB mặc định dùng logo nội bộ. */
  bankLogo:
    (import.meta.env.VITE_BANK_LOGO as string | undefined) || defaultBankLogo(),
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
