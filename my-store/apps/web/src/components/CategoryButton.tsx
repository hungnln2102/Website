"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, ChevronRight, X, Package, ArrowRight } from "lucide-react";
import { fetchCategories, fetchProducts, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import ProductCard from "./ProductCard";

interface CategoryButtonProps {
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  }>;
  selectedCategory?: string | null;
  onSelectCategory?: (slug: string | null) => void;
}

export default function CategoryButton({ 
  categories: propsCategories, 
  selectedCategory: propsSelectedCategory, 
  onSelectCategory 
}: CategoryButtonProps) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [hoveredCategorySlug, setHoveredCategorySlug] = useState<string | null>(null);
  const [megaMenuTop, setMegaMenuTop] = useState<number>(0);
  const [megaMenuLeft, setMegaMenuLeft] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setMegaMenuTop(rect.bottom + 4);
      // On mobile/tablet, use small margin
      if (mobile) {
        setMegaMenuLeft(8);
      } else {
        setMegaMenuLeft(rect.left);
      }
    }
  }, []);

  // Track window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (isMegaMenuOpen) {
        updateMenuPosition();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMegaMenuOpen, updateMenuPosition]);

  // Fetch data internally for the mega menu content
  const { data: fetchedCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: !propsCategories,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const categories = useMemo(() => {
    const cats = propsCategories || fetchedCategories.map((c: CategoryDto) => ({
      id: String(c.id),
      name: c.name,
      slug: slugify(c.name),
      icon: null,
    }));
    return cats;
  }, [propsCategories, fetchedCategories]);

  // Determine which category's products to show
  const activeHoveredSlug = hoveredCategorySlug !== null 
    ? hoveredCategorySlug 
    : (propsSelectedCategory || (categories.length > 0 ? categories[0].slug : null));

  const filteredProducts = useMemo(() => {
    if (activeHoveredSlug === null) return [];
    
    const category = categories.find(c => c.slug === activeHoveredSlug);
    if (!category) return [];
    
    // Find products for this category
    const categoryData = fetchedCategories.find((c: CategoryDto) => slugify(c.name) === activeHoveredSlug);
    if (!categoryData) return [];
    
    const productIds = new Set((categoryData.product_ids ?? []).map(String));
    const filtered = allProducts.filter((p: any) => productIds.has(String(p.id)));
    
    return filtered.slice(0, 6).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      description: p.description || null,
      base_price: p.base_price ?? 0,
      image_url: p.image_url || null,
      discount_percentage: p.discount_percentage ?? 0,
      sales_count: p.sales_count ?? 0,
      average_rating: p.average_rating ?? 0,
      package_count: p.package_count ?? 1,
      slug: p.slug || slugify(p.name),
      category_id: p.category_id || null,
      created_at: p.created_at || new Date().toISOString(),
      full_description: null,
      is_featured: false,
      purchase_rules: null,
    }));
  }, [activeHoveredSlug, categories, fetchedCategories, allProducts]);

  const handleCategoryClick = useCallback((slug: string | null) => {
    if (onSelectCategory && slug) {
      onSelectCategory(slug);
      window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
      window.dispatchEvent(new Event("popstate"));
    }
    setIsMegaMenuOpen(false);
  }, [onSelectCategory]);

  const handleProductClick = useCallback((slug: string) => {
    if (onSelectCategory) {
      // This is handled by parent component
      return;
    }
    window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
    window.dispatchEvent(new Event("popstate"));
    setIsMegaMenuOpen(false);
  }, [onSelectCategory]);

  // Close menu when clicking outside (account for portaled menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inButton && !inMenu) {
        setIsMegaMenuOpen(false);
        setHoveredCategorySlug(null);
      }
    };

    if (isMegaMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMegaMenuOpen]);

  // Update menu position on scroll/resize (menu is portaled to body)
  useEffect(() => {
    if (!isMegaMenuOpen) return;
    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [isMegaMenuOpen, updateMenuPosition]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={buttonRef}
      className="group relative z-50"
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        updateMenuPosition();
        setIsMegaMenuOpen(true);
      }}
      onMouseLeave={() => {
        timeoutRef.current = setTimeout(() => {
          setIsMegaMenuOpen(false);
          setHoveredCategorySlug(null);
        }, 200);
      }}
    >
      <button
        onClick={() => {
          updateMenuPosition();
          setIsMegaMenuOpen((open) => !open);
        }}
        className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 sm:px-4 min-h-[44px] ${
          isMegaMenuOpen 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 shadow-md shadow-blue-200/50 dark:from-blue-900/30 dark:to-blue-900/20 dark:text-blue-400 dark:shadow-blue-900/50' 
            : 'hover:bg-white hover:shadow-md hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 active:scale-[0.98]'
        }`}
        aria-expanded={isMegaMenuOpen}
        aria-haspopup="true"
      >
        <Layers className={`h-4 w-4 sm:h-4 sm:w-4 shrink-0 transition-all duration-300 ${isMegaMenuOpen ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 group-hover:scale-110'}`} />
        <span className={`text-xs sm:text-sm font-bold tracking-tight transition-colors duration-300 whitespace-nowrap ${isMegaMenuOpen ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300'}`}>
          DANH MỤC
        </span>
        <ChevronRight 
          className={`h-3.5 w-3.5 shrink-0 transition-all duration-300 ${isMegaMenuOpen ? 'rotate-90 text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300'}`}
          aria-hidden="true"
        />
      </button>

      {/* Mega Menu — portaled to body so position:fixed uses viewport (avoids header backdrop-blur) */}
      {isMegaMenuOpen && categories.length > 0 && createPortal(
        <aside
          ref={menuRef}
          className="fixed z-[9999] w-[calc(100vw-1rem)] max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-[calc(100vw-2rem)] md:w-[calc(100vw-3rem)] lg:w-screen lg:max-w-6xl"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={() => {
            timeoutRef.current = setTimeout(() => {
              setIsMegaMenuOpen(false);
              setHoveredCategorySlug(null);
            }, 200);
          }}
          onClick={(e) => {
            // Close on mobile when clicking outside categories/products
            if (isMobile && (e.target as HTMLElement).closest('section')) {
              // Allow clicks within sections
            } else if (isMobile && (e.target as HTMLElement) === menuRef.current) {
              setIsMegaMenuOpen(false);
            }
          }}
          aria-label="Danh mục sản phẩm"
          role="menu"
          style={{ 
            position: 'fixed',
            zIndex: 9999,
            top: megaMenuTop > 0 ? `${megaMenuTop}px` : 'auto',
            left: isMobile ? '8px' : (megaMenuLeft > 0 ? `${Math.max(8, megaMenuLeft - 8)}px` : '8px'),
            right: isMobile ? '8px' : 'auto',
            maxHeight: 'calc(100vh - ' + (megaMenuTop > 0 ? megaMenuTop + 16 : 80) + 'px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 overflow-hidden flex-1 min-h-0">
            {/* Categories List */}
            <section className="border-r border-gray-100 dark:border-slate-700 p-3 sm:p-4 flex flex-col min-h-0" aria-label="Danh sách danh mục">
              <div className="mb-3 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Danh mục</h3>
                <button
                  onClick={() => setIsMegaMenuOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Đóng menu"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-1 overflow-y-auto flex-1 min-h-0 no-scrollbar">
                {categories.map((category) => {
                  const isActive = hoveredCategorySlug === category.slug || propsSelectedCategory === category.slug;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.slug)}
                      onMouseEnter={() => setHoveredCategorySlug(category.slug)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all min-h-[44px] ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                      role="menuitem"
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span className="text-sm font-semibold">{category.name}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Products Grid */}
            {activeHoveredSlug && (
              <section className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden" aria-labelledby="products-heading">
                <div className="mb-4 flex items-center justify-between shrink-0 gap-2">
                  <h3 id="products-heading" className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                    {categories.find(c => c.slug === activeHoveredSlug)?.name || "Sản phẩm"}
                  </h3>
                  <a
                    href={`/danh-muc/${activeHoveredSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSelectCategory) {
                        onSelectCategory(activeHoveredSlug);
                      }
                      window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(activeHoveredSlug)}`);
                      window.dispatchEvent(new Event("popstate"));
                      setIsMegaMenuOpen(false);
                    }}
                    className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 whitespace-nowrap shrink-0 min-h-[44px]"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 overflow-y-auto flex-1 min-h-0 no-scrollbar">
                    {filteredProducts.map((product: any) => (
                      <article key={product.id} className="group">
                        <ProductCard
                          {...product}
                          variant="minimal"
                          onClick={() => handleProductClick(product.slug)}
                        />
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
                    <Package className="mb-4 h-12 w-12 text-gray-200 dark:text-slate-700" aria-hidden="true" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Danh mục này chưa có sản phẩm
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </aside>,
        document.body
      )}
    </div>
  );
}
