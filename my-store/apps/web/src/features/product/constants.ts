import type { LucideIcon } from "lucide-react";
import { Send, MessageCircle, PhoneCall } from "lucide-react";

export const CONTACT_LINKS: { label: string; bg: string; icon: LucideIcon; href: string }[] = [
  { label: "Telegram", bg: "#229ED9", icon: Send, href: "https://t.me/hung_culi" },
  { label: "Messenger", bg: "#0084FF", icon: MessageCircle, href: "https://m.me/cyrusdemons" },
  { label: "Zalo", bg: "#0068FF", icon: PhoneCall, href: "https://zalo.me/0378304963" },
];
