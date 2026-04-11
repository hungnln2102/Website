"use client";
import { BRANDING_ASSETS } from "@/lib/brandingAssets";
import { SearchBar } from "@/components/header/SearchBar";
import { CartHeaderButton } from "@/components/header/CartHeaderButton";
import { UserMenu } from "@/components/header/UserMenu";
import { ModeToggle } from "@/components/mode-toggle";
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
  /** true: logo + tìm kiếm + chế độ sáng/tối trên header; giỏ / tài khoản do MenuBar hiển thị */
  omitNavActions?: boolean;
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
  omitNavActions = false,
}: SiteHeaderProps) {
  return (
    <header
      className={`sticky top-0 left-0 right-0 z-[100] border-b py-3 transition-all duration-500 shadow-sm ${
        isScrolled
          ? "border-gray-200/50 bg-white/90 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/90"
          : "border-gray-100 bg-white dark:border-slate-800/50 dark:bg-slate-950/70"
      }`}
    >
      <div
        className={
          omitNavActions
            ? "mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 sm:gap-x-4 sm:px-6 md:gap-x-6 lg:px-8"
            : "mx-auto flex max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6 md:gap-6 lg:px-8"
        }
      >
        {/* Logo */}
        <div className={omitNavActions ? "min-w-0 justify-self-start" : "contents"}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onLogoClick();
            }}
            className={`flex items-center gap-1.5 rounded-xl px-1 py-1 -ml-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:gap-2 md:gap-4 ${
              omitNavActions ? "min-w-0" : "shrink-0"
            }`}
            aria-label="Quay về trang chủ"
          >
          <img
            src={BRANDING_ASSETS.logoTransparent}
            alt="Mavryk Logo"
            title="Mavryk Premium Store"
            width={40}
            height={40}
            className="h-9 w-9 object-contain sm:h-9 sm:w-9 md:h-10 md:w-10"
          />
          <div className="hidden min-h-[2.75rem] flex-col justify-center text-left sm:flex">
            <div className="font-bold tracking-tight text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
              Mavryk Premium <span className="text-blue-600 dark:text-blue-500">Store</span>
            </div>
            <p
              className={`mt-0.5 hidden text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-gray-500 transition-opacity duration-300 dark:text-slate-400 lg:block lg:min-h-[12px] ${
                isScrolled ? "opacity-0" : "opacity-100"
              }`}
              aria-hidden={isScrolled}
            >
              Phần mềm bản quyền chính hãng
            </p>
          </div>
        </a>
        </div>

        {/* Tìm kiếm (+ giỏ khi hiện cụm tài khoản trên header) */}
        {omitNavActions ? (
          <>
            <div className="min-w-0 w-full max-w-full px-1 sm:px-2">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                products={products}
                categories={categories}
                onProductClick={onProductClick}
                onCategoryClick={onCategoryClick}
                isScrolled={isScrolled}
                embeddedInHeader
              />
            </div>
            <div className="flex shrink-0 items-center justify-self-end border-l border-gray-200/80 pl-2 dark:border-slate-600 sm:pl-3 md:pl-4">
              <div className="flex shrink-0" aria-hidden="true">
                <ModeToggle />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center justify-center">
              <div className="flex w-[min(100%,36rem)] min-w-0 items-center gap-1.5 sm:w-[min(100%,42rem)] sm:gap-2 md:w-[min(100%,48rem)]">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  searchPlaceholder={searchPlaceholder}
                  products={products}
                  categories={categories}
                  onProductClick={onProductClick}
                  onCategoryClick={onCategoryClick}
                  isScrolled={isScrolled}
                  embeddedInHeader
                />
                <CartHeaderButton />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 border-l border-gray-200/80 pl-2.5 dark:border-slate-600 sm:gap-1.5 sm:pl-3 md:pl-4">
              <UserMenu user={user} onLogout={onLogout} />
              <div className="flex shrink-0" aria-hidden="true">
                <ModeToggle />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
