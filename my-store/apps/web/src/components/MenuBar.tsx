"use client";

import { useRef } from "react";
import { Package, Gift, Newspaper, ShieldCheck, CreditCard, Phone, HelpCircle } from "lucide-react";
import CategoryButton from "./CategoryButton";

interface MenuBarProps {
  isScrolled: boolean;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  }>;
  selectedCategory?: string | null;
  onSelectCategory?: (slug: string | null) => void;
}

export default function MenuBar({ 
  isScrolled,
  categories,
  selectedCategory,
  onSelectCategory
}: MenuBarProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { label: "Sản phẩm", icon: Package, href: "#" },
    { label: "Khuyến mãi", icon: Gift, href: "#" },
    { label: "Tin tức", icon: Newspaper, href: "#" },
    { label: "Bảo hành", icon: ShieldCheck, href: "#" },
    { label: "Thanh toán", icon: CreditCard, href: "#" },
  ];

  return (
    <nav 
      ref={menuRef}
      className="relative z-50 border-b border-gray-200/90 bg-gradient-to-b from-gray-50/95 to-white backdrop-blur-sm dark:from-slate-900/98 dark:to-slate-950 dark:border-slate-700/80"
      aria-label="Main navigation"
    >
      {/* Accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent dark:via-blue-400/20" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" style={{ position: 'relative', overflow: 'visible' }}>
        <div className={`relative flex ${isScrolled ? "h-10" : "h-12"} items-center justify-between gap-0 overflow-x-auto no-scrollbar sm:gap-0`} style={{ overflowY: 'visible' }}>
          {/* Left side: DANH MỤC + Menu Items */}
          <div className="flex items-center gap-0">
            {/* DANH MỤC - primary */}
            <div className="flex shrink-0 items-stretch pr-1 sm:pr-2">
              <CategoryButton
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={onSelectCategory}
              />
            </div>

            {/* Divider */}
            <div className="hidden h-5 w-px shrink-0 bg-gray-200 dark:bg-slate-600 sm:block" aria-hidden />

            {/* Menu Items */}
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar sm:gap-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 sm:px-4"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400" />
                  <span className="text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300">
                    {item.label}
                  </span>
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-[75%] dark:bg-blue-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Divider */}
            <div className="hidden h-5 w-px shrink-0 bg-gray-200 dark:bg-slate-600 sm:block" aria-hidden />

            {/* Hỗ trợ / Liên hệ */}
            <a
              href="#lien-he"
              className="group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 sm:px-4"
            >
              <Phone className="h-4 w-4 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400" />
              <span className="hidden text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300 sm:inline">
                Hỗ trợ
              </span>
              <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-[75%] dark:bg-blue-400" />
            </a>

            <a
              href="#huong-dan"
              className="group relative hidden shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 sm:flex sm:px-4"
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400" />
              <span className="text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300">
                Hướng dẫn
              </span>
              <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-[75%] dark:bg-blue-400" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
