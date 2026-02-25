import type { LucideIcon } from "lucide-react";
import { Home, Package, Gift, Newspaper, ShieldCheck, CreditCard } from "lucide-react";

export const MENU_ITEMS: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Trang chủ", icon: Home, href: "/" },
  { label: "Sản phẩm", icon: Package, href: "/tat-ca-san-pham" },
  { label: "Khuyến mãi", icon: Gift, href: "/khuyen-mai" },
  { label: "Tin tức", icon: Newspaper, href: "#tin-tuc" },
  { label: "Bảo hành", icon: ShieldCheck, href: "#bao-hanh" },
  { label: "Thanh toán", icon: CreditCard, href: "#thanh-toan" },
];
