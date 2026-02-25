import type { LucideIcon } from "lucide-react";
import { Wallet, Sparkles, Gift, Zap, Crown } from "lucide-react";

export const BANK_CONFIG = {
  bankId: import.meta.env.VITE_BANK_ID || "970432",
  bankName: import.meta.env.VITE_BANK_NAME || "VPBank",
  accountNo: import.meta.env.VITE_BANK_ACCOUNT_NO || "9183400998",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "NGO HUNG",
  template: "compact",
} as const;

export type TopupPackageItem = {
  id: string;
  amount: number;
  bonus: number;
  label: string;
  bonusLabel?: string;
  icon: LucideIcon;
  color: string;
  popular: boolean;
  isCustom?: boolean;
};

export const TOPUP_PACKAGES: TopupPackageItem[] = [
  { id: "50k", amount: 50000, bonus: 0, label: "50.000đ", icon: Zap, color: "from-blue-500 to-cyan-500", popular: false },
  { id: "100k", amount: 100000, bonus: 5000, label: "100.000đ", bonusLabel: "+5.000đ", icon: Sparkles, color: "from-emerald-500 to-teal-500", popular: false },
  { id: "200k", amount: 200000, bonus: 15000, label: "200.000đ", bonusLabel: "+15.000đ", icon: Gift, color: "from-violet-500 to-purple-500", popular: true },
  { id: "500k", amount: 500000, bonus: 50000, label: "500.000đ", bonusLabel: "+50.000đ", icon: Crown, color: "from-amber-500 to-orange-500", popular: false },
  { id: "1m", amount: 1000000, bonus: 120000, label: "1.000.000đ", bonusLabel: "+120.000đ", icon: Crown, color: "from-rose-500 to-pink-500", popular: false },
  { id: "custom", amount: 0, bonus: 0, label: "Tùy chọn", icon: Wallet, color: "from-slate-500 to-slate-600", popular: false, isCustom: true },
];
