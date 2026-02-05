"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, LogIn, LogOut, User, ChevronDown, Wallet } from "lucide-react";
import SearchDropdown, { type SearchProduct, type SearchCategory } from "@/components/SearchDropdown";
import { ModeToggle } from "@/components/mode-toggle";
import logo from "@/asset/logo.png";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  balance?: number;
}

interface SiteHeaderProps {
  isScrolled: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLogoClick: () => void;
  searchPlaceholder?: string;
  products?: SearchProduct[];
  categories?: SearchCategory[];
  onProductClick?: (slug: string) => void;
  onCategoryClick?: (slug: string) => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export default function SiteHeader({
  isScrolled,
  searchQuery,
  onSearchChange,
  onLogoClick,
  searchPlaceholder = "Tìm kiếm sản phẩm...",
  products = [],
  categories = [],
  onProductClick,
  onCategoryClick,
  user,
  onLogout,
}: SiteHeaderProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductClick = (slug: string) => {
    setIsDropdownVisible(false);
    onSearchChange("");
    onProductClick?.(slug);
  };

  const handleCategoryClick = (slug: string) => {
    setIsDropdownVisible(false);
    onSearchChange("");
    onCategoryClick?.(slug);
  };

  return (
    <header
      className={`relative z-[100] border-b transition-all duration-500 ${
        isScrolled
          ? "border-gray-200/50 bg-white/80 py-2 dark:border-slate-800/50 dark:bg-slate-950/80"
          : "border-gray-100 bg-white py-3.5 dark:border-slate-800/50 dark:bg-slate-950/70"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 md:gap-6 lg:px-8">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-1 py-1 -ml-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:gap-2 md:gap-4"
          aria-label="Quay về trang chủ"
        >
            <img
              src={logo}
              alt="Mavryk Logo"
              className={`object-contain transition-all duration-500 ${
                isScrolled
                  ? "h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9"
                  : "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-11 lg:w-11"
              }`}
            />
          <div className="hidden sm:block text-left">
            <h1
              className={`font-bold tracking-tight text-gray-900 transition-all duration-500 dark:text-white ${
                isScrolled
                  ? "text-xs sm:text-sm md:text-base"
                  : "text-sm sm:text-base md:text-lg lg:text-xl"
              }`}
            >
              Mavryk Premium <span className="text-blue-600 dark:text-blue-500">Store</span>
            </h1>
            {!isScrolled && (
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 lg:block">
                Phần mềm bản quyền chính hãng
              </p>
            )}
          </div>
        </a>

        <div
          ref={searchContainerRef}
          className={`relative mx-1 flex min-w-0 flex-1 max-w-full transition-all duration-500 z-[100] sm:mx-2 md:mx-4 md:max-w-md ${
            isScrolled ? "md:max-w-lg" : ""
          }`}
        >
          <div className="relative w-full group">
            {/* Glow effect for light mode */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur-sm transition-opacity duration-300 dark:hidden" />
            
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
              <Search
                className={`h-4 w-4 transition-colors ${
                  searchQuery
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-focus-within:text-blue-600 dark:text-slate-500 dark:group-focus-within:text-blue-400"
                }`}
              />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsDropdownVisible(true)}
              className={`relative w-full pl-10 pr-10 transition-all duration-500 rounded-xl text-sm font-medium focus:outline-none placeholder:text-gray-500 ${
                isScrolled ? "h-9" : "h-10"
              } ${
                // Light mode: prominent white background with shadow and border
                "bg-white border-2 border-blue-200 shadow-lg shadow-blue-100/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:shadow-xl focus:shadow-blue-200/50 " +
                // Dark mode: lighter bg for contrast, visible text & placeholder
                "dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 dark:shadow-none dark:focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:bg-slate-800"
              }`}
              aria-label={searchPlaceholder}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange("");
                  setIsDropdownVisible(false);
                }}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 z-10"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* Search Dropdown */}
            <SearchDropdown
              searchQuery={searchQuery}
              products={products}
              categories={categories}
              onProductClick={handleProductClick}
              onCategoryClick={handleCategoryClick}
              isVisible={isDropdownVisible}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">
          {user ? (
            /* User Menu when logged in */
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2 py-2 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 min-h-[36px] sm:min-h-[40px] sm:gap-2 sm:px-3"
                aria-label="Menu người dùng"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                  {user.firstName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Số dư: {(user.balance ?? 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.lastName} {user.firstName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        window.history.pushState({}, "", "/nap-tien");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <span>Nạp tiền</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        window.history.pushState({}, "", "/tai-khoan");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <User className="h-4 w-4" />
                      Tài khoản của tôi
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Login Button when not logged in */
            <button
              onClick={() => {
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 transition-all duration-300 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:bg-blue-900/20 dark:hover:shadow-blue-900/20 active:scale-95 min-h-[36px] sm:min-h-[40px] sm:gap-2 sm:px-4"
              aria-label="Đăng nhập"
            >
              <LogIn className="h-4 w-4 shrink-0 text-gray-600 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110 dark:text-slate-400 dark:group-hover:text-blue-400" />
              <span className="hidden sm:inline text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-300 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 whitespace-nowrap">
                Đăng nhập
              </span>
            </button>
          )}
          <div className="flex shrink-0" aria-hidden="true">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

