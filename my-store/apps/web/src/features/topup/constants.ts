import type { LucideIcon } from "lucide-react";
import { Wallet, Sparkles, Gift, Zap, Crown, ShoppingBag } from "lucide-react";

export const BANK_CONFIG = {
  bankId: import.meta.env.VITE_BANK_ID || "970432",
  bankName: import.meta.env.VITE_BANK_NAME || "VPBank",
  accountNo: import.meta.env.VITE_BANK_ACCOUNT_NO || "9183400998",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "NGO HUNG",
  template: "compact",
} as const;

export type TopupPackageItem = {
  id: string;
  product_id?: string; // từ productid_payment khi lấy từ API
  amount: number;
  bonus: number;
  label: string;
  bonusLabel?: string;
  icon: LucideIcon;
  color: string;
  popular: boolean;
  promotionPercent?: number; // % khuyến mãi → hiển thị tag "HOT X%"
  isCustom?: boolean;
};

/** Icon mặc định theo thứ tự gói (dùng khi map từ API). Gói "Tùy chọn" dùng Wallet. */
export const TOPUP_ICONS: LucideIcon[] = [Zap, Sparkles, Gift, Crown, ShoppingBag, Wallet];

export const TOPUP_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-slate-500 to-slate-600",
] as const;

/** Gói mặc định fallback khi API lỗi hoặc chưa có bảng productid_payment (không có gói Tùy chọn). */
export const TOPUP_PACKAGES_FALLBACK: TopupPackageItem[] = [
  { id: "50k", amount: 50000, bonus: 0, label: "50.000đ", icon: Zap, color: TOPUP_COLORS[0], popular: false },
  { id: "100k", amount: 100000, bonus: 5000, label: "100.000đ", bonusLabel: "+5.000đ", icon: Sparkles, color: TOPUP_COLORS[1], popular: false, promotionPercent: 5 },
  { id: "200k", amount: 200000, bonus: 15000, label: "200.000đ", bonusLabel: "+15.000đ", icon: Gift, color: TOPUP_COLORS[2], popular: true, promotionPercent: 7.5 },
  { id: "500k", amount: 500000, bonus: 50000, label: "500.000đ", bonusLabel: "+50.000đ", icon: Crown, color: TOPUP_COLORS[3], popular: false, promotionPercent: 10 },
  { id: "1m", amount: 1000000, bonus: 120000, label: "1.000.000đ", bonusLabel: "+120.000đ", icon: Crown, color: TOPUP_COLORS[4], popular: false, promotionPercent: 12 },
];
