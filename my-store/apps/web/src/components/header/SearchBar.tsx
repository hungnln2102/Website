import { useRef, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import SearchDropdown, {
  type SearchProduct,
  type SearchCategory,
} from "@/components/SearchDropdown";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  products?: SearchProduct[];
  categories?: SearchCategory[];
  onProductClick?: (slug: string) => void;
  onCategoryClick?: (slug: string) => void;
  isScrolled?: boolean;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm sản phẩm...",
  products = [],
  categories = [],
  onProductClick,
  onCategoryClick,
  isScrolled = false,
}: SearchBarProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
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
            "bg-white border-2 border-blue-200 shadow-lg shadow-blue-100/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:shadow-xl focus:shadow-blue-200/50 " +
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
  );
}
