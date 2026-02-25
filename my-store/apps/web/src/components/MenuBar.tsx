"use client";

import { useRef, useState, useEffect } from "react";
import { Phone, ClipboardList, Menu, X, ShoppingCart, LogIn } from "lucide-react";
import { createPortal } from "react-dom";
import CategoryButton from "@/features/catalog/components/CategoryButton";
import { useAuth } from "@/features/auth/hooks";
import { getCartCount, getAuthToken } from "@/lib/api";
import { MENU_ITEMS } from "./menu/menuConstants";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsMounted(true);

    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Array<{ quantity?: number }>>;
      const items = customEvent.detail ?? [];
      const count = Array.isArray(items) ? items.reduce((s, i) => s + (i.quantity ?? 1), 0) : 0;
      setCartCount(count);
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    if (user) {
      const token = getAuthToken();
      getCartCount(token).then((res) => {
        if (res.success && res.data != null) setCartCount(res.data.totalItems ?? 0);
      });
    } else {
      setCartCount(0);
    }

    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [user]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLoginPopup(true);
      handleMobileMenuClose();
    }
  };

  const goToLogin = () => {
    setShowLoginPopup(false);
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <>
      <nav 
        ref={menuRef}
        className={`sticky z-50 border-b border-gray-200/90 bg-gradient-to-b from-gray-50/95 to-white backdrop-blur-sm dark:from-slate-900/98 dark:to-slate-950 dark:border-slate-700/80 shadow-sm dark:shadow-slate-900/20 transition-all duration-500 ${
          isScrolled ? "top-[60px] sm:top-[64px] md:top-[68px]" : "top-[72px] sm:top-[76px] md:top-[80px]"
        }`}
        aria-label="Main navigation"
      >
        {/* Accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent dark:via-blue-400/30" />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-5 lg:px-8">
          <div className={`relative flex ${isScrolled ? "h-11" : "h-14"} items-center justify-between gap-3`}>
            {/* Left side: DANH MỤC + Menu Items (Desktop) */}
            <div className="hidden lg:flex items-center gap-0 flex-1 min-w-0">
              {/* DANH MỤC - primary */}
              <div className="flex shrink-0 items-stretch pr-2">
                <CategoryButton
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={onSelectCategory}
                />
              </div>

              {/* Divider */}
              <div className="h-5 w-px shrink-0 bg-gray-200 dark:bg-slate-600 mx-1" aria-hidden />

              {/* Menu Items - Desktop */}
              <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar lg:gap-1">
                {MENU_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-2.5 transition-all duration-300 hover:bg-white hover:shadow-md hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 active:scale-[0.98] min-h-[44px] lg:gap-1.5 lg:px-3"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-gray-500 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110 dark:text-slate-400 dark:group-hover:text-blue-400" />
                    <span className="text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-300 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300 whitespace-nowrap">
                      {item.label}
                    </span>
                    <span className="absolute bottom-1.5 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-[70%] dark:from-blue-400 dark:to-blue-500" />
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet: Category Button */}
            <div className="flex lg:hidden items-center gap-2.5 flex-1 min-w-0">
              <div className="flex shrink-0">
                <CategoryButton
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={onSelectCategory}
                />
              </div>
            </div>

            {/* Right side: Action buttons (Desktop) */}
            <div className="hidden lg:flex shrink-0 items-center gap-2 ml-auto">
              {/* Divider */}
              <div className="h-5 w-px shrink-0 bg-gray-200 dark:bg-slate-600" aria-hidden />

              {/* Shopping Cart Icon */}
              <a
                href={user ? "/gio-hang" : "#"}
                onClick={handleCartClick}
                className="group relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-2.5 transition-all duration-300 hover:bg-white hover:shadow-md hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 active:scale-[0.98] min-h-[44px] lg:gap-1.5 lg:px-3"
                aria-label="Giỏ hàng"
              >
                <div className="relative">
                  <ShoppingCart className="h-4 w-4 shrink-0 text-gray-500 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110 dark:text-slate-400 dark:group-hover:text-blue-400" />
                  {user && cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-300 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300 whitespace-nowrap">
                  Giỏ hàng
                </span>
                <span className="absolute bottom-1.5 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-[70%] dark:from-blue-400 dark:to-blue-500" />
              </a>

              <a
                href="/tai-khoan"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, "", "/tai-khoan");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="group relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-2.5 transition-all duration-300 hover:bg-white hover:shadow-md hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 active:scale-[0.98] min-h-[44px] lg:gap-1.5 lg:px-3"
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-gray-500 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110 dark:text-slate-400 dark:group-hover:text-blue-400" />
                <span className="text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-300 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300 whitespace-nowrap">
                  Lịch sử đơn hàng
                </span>
                <span className="absolute bottom-1.5 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-[70%] dark:from-blue-400 dark:to-blue-500" />
              </a>

            </div>

            {/* Mobile: Menu button (moved to right) */}
            <div className="flex lg:hidden shrink-0 items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`flex shrink-0 items-center justify-center rounded-xl p-2.5 transition-all duration-300 min-h-[44px] min-w-[44px] ${
                  isMobileMenuOpen
                    ? "bg-blue-50 text-blue-600 shadow-md shadow-blue-200/50 dark:bg-blue-900/30 dark:text-blue-400 dark:shadow-blue-900/50"
                    : "hover:bg-gray-100/80 hover:shadow-sm hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 active:scale-95"
                }`}
                aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 transition-transform duration-300" />
                ) : (
                  <Menu className="h-5 w-5 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={handleMobileMenuClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className={`fixed top-0 right-0 z-[9999] h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            aria-label="Mobile navigation menu"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-slate-700/80 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 px-5 py-5">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                  Menu
                </h2>
                <button
                  onClick={handleMobileMenuClose}
                  className="flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 min-h-[44px] min-w-[44px]"
                  aria-label="Đóng menu"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
                {MENU_ITEMS.map((item, index) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={handleMobileMenuClose}
                    className="group flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:from-blue-900/20 dark:hover:to-blue-900/10 dark:hover:shadow-blue-900/20 active:scale-[0.98] min-h-[52px]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-base font-semibold text-gray-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {item.label}
                    </span>
                  </a>
                ))}
              </nav>

              {/* Footer Actions */}
              <div className="border-t border-gray-200/80 dark:border-slate-700/80 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-slate-900/50 px-4 py-5 space-y-2">
                <a
                  href={user ? "/gio-hang" : "#"}
                  onClick={(e) => {
                    handleCartClick(e);
                    handleMobileMenuClose();
                  }}
                  className="group flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:from-blue-900/20 dark:hover:to-blue-900/10 dark:hover:shadow-blue-900/20 active:scale-[0.98] min-h-[52px]"
                >
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                    <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                    {user && cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-semibold text-gray-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 transition-colors duration-300">
                    Giỏ hàng
                  </span>
                </a>
                <a
                  href="#lien-he"
                  onClick={handleMobileMenuClose}
                  className="group flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:from-blue-900/20 dark:hover:to-blue-900/10 dark:hover:shadow-blue-900/20 active:scale-[0.98] min-h-[52px]"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-base font-semibold text-gray-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 transition-colors duration-300">
                    Hỗ trợ
                  </span>
                </a>
                <a
                  href="/tai-khoan"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, "", "/tai-khoan");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                    handleMobileMenuClose();
                  }}
                  className="group flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:from-blue-900/20 dark:hover:to-blue-900/10 dark:hover:shadow-blue-900/20 active:scale-[0.98] min-h-[52px]"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
                    <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-base font-semibold text-gray-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 transition-colors duration-300">
                    Lịch sử đơn hàng
                  </span>
                </a>
              </div>
            </div>
          </aside>
        </>,
        document.body
      )}

      {/* Popup yêu cầu đăng nhập khi bấm Giỏ hàng lúc chưa đăng nhập */}
      {showLoginPopup && isMounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginPopup(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-popup-title"
          >
            <p id="login-popup-title" className="mb-4 text-center text-slate-700 dark:text-slate-200">
              Quý khách cần đăng nhập để thực hiện thao tác này
            </p>
            <button
              type="button"
              onClick={goToLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
            >
              <LogIn className="h-5 w-5" />
              Đăng nhập
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
