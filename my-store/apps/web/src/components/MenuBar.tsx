"use client";

import { Home, Package, Gift, Newspaper, ShieldCheck, CreditCard } from "lucide-react";

const menuItems = [
  { label: "Trang chủ", icon: Home, href: "#" },
  { label: "Sản phẩm", icon: Package, href: "#" },
  { label: "Khuyến mãi", icon: Gift, href: "#" },
  { label: "Tin tức", icon: Newspaper, href: "#" },
  { label: "Bảo hành", icon: ShieldCheck, href: "#" },
  { label: "Thanh toán", icon: CreditCard, href: "#" },
];

export default function MenuBar({ isScrolled }: { isScrolled: boolean }) {
  return (
    <nav className="relative z-40 border-b border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex ${isScrolled ? "h-10" : "h-12"} items-center justify-start gap-1 overflow-x-auto no-scrollbar sm:gap-4`}>
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative flex shrink-0 cursor-pointer items-center gap-2 px-3 py-2 transition-all hover:bg-blue-50/50 rounded-lg dark:hover:bg-blue-900/20"
            >
              <item.icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="text-xs font-bold text-gray-600 transition-colors group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">
                {item.label}
              </span>
              
              {/* Bottom active-like indicator on hover */}
              <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-blue-600 transition-all duration-300 group-hover:w-full dark:bg-blue-400" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
