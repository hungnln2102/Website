import type { LucideIcon } from "lucide-react";
import { Home, Package, Gift, Newspaper, ShieldCheck, CreditCard, KeyRound } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export const MENU_ITEMS: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Trang chủ", icon: Home, href: ROUTES.home },
  { label: "Sản phẩm", icon: Package, href: ROUTES.allProducts },
  { label: "Khuyến mãi", icon: Gift, href: ROUTES.promotions },
  { label: "Tin tức", icon: Newspaper, href: ROUTES.news },
  { label: "Hỗ trợ", icon: ShieldCheck, href: "/#lien-he" },
  { label: "Trung tâm gói", icon: KeyRound, href: ROUTES.otp },
];
