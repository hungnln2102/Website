import { TOPUP_PACKAGES, type TopupPackageItem } from "./constants";

export function formatTopupCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export function getSelectedAmount(
  selectedPackage: string | null,
  customAmount: string,
  packages: TopupPackageItem[] = TOPUP_PACKAGES
): number {
  if (selectedPackage === "custom") {
    return parseInt(customAmount.replace(/\D/g, ""), 10) || 0;
  }
  const pkg = packages.find((p) => p.id === selectedPackage);
  return pkg?.amount ?? 0;
}

export function getSelectedBonus(
  selectedPackage: string | null,
  customAmount: string,
  packages: TopupPackageItem[] = TOPUP_PACKAGES
): number {
  if (selectedPackage === "custom") {
    const amount = parseInt(customAmount.replace(/\D/g, ""), 10) || 0;
    if (amount >= 1000000) return Math.floor(amount * 0.12);
    if (amount >= 500000) return Math.floor(amount * 0.1);
    if (amount >= 200000) return Math.floor(amount * 0.075);
    if (amount >= 100000) return Math.floor(amount * 0.05);
    return 0;
  }
  const pkg = packages.find((p) => p.id === selectedPackage);
  return pkg?.bonus ?? 0;
}

export function formatCustomAmountInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
