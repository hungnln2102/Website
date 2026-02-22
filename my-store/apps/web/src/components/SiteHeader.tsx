"use client";

import logo from "@/asset/logo.png";
import { SearchBar } from "@/components/header/SearchBar";
import { UserMenu } from "@/components/header/UserMenu";
import type { SearchProduct, SearchCategory } from "@/components/SearchDropdown";

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
  return (
    <header
      className={`sticky top-0 left-0 right-0 z-[100] border-b transition-all duration-500 shadow-sm ${
        isScrolled
          ? "border-gray-200/50 bg-white/90 backdrop-blur-md py-2 dark:border-slate-800/50 dark:bg-slate-950/90"
          : "border-gray-100 bg-white py-3.5 dark:border-slate-800/50 dark:bg-slate-950/70"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 md:gap-6 lg:px-8">
        {/* Logo */}
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

        {/* Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          products={products}
          categories={categories}
          onProductClick={onProductClick}
          onCategoryClick={onCategoryClick}
          isScrolled={isScrolled}
        />

        {/* User Menu */}
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
