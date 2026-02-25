import type { LucideIcon } from "lucide-react";
import { User, ShoppingBag, Receipt, Shield, MessageSquare, Ticket } from "lucide-react";

export type ProfileTabId =
  | "account"
  | "orders"
  | "transactions"
  | "security"
  | "comments"
  | "promo";

export const PROFILE_TABS: { id: ProfileTabId; label: string; icon: LucideIcon }[] = [
  { id: "account", label: "Tài khoản", icon: User },
  { id: "orders", label: "Lịch sử đơn hàng", icon: ShoppingBag },
  { id: "transactions", label: "Lịch sử giao dịch", icon: Receipt },
  { id: "security", label: "Mật khẩu và bảo mật", icon: Shield },
  { id: "comments", label: "Bình luận của tôi", icon: MessageSquare },
  { id: "promo", label: "Mã Khuyến Mãi", icon: Ticket },
];
