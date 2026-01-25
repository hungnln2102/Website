"use client";

<<<<<<< HEAD
import { Home, Package, Gift, Newspaper, ShieldCheck, CreditCard, LayoutGrid, ChevronRight, ArrowRight, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { slugify } from "@/lib/utils";
import ProductCard from "./ProductCard";

const menuItems = [
  { label: "Trang chủ", icon: Home, href: "/" },
=======
import { Home, Package, Gift, Newspaper, ShieldCheck, CreditCard } from "lucide-react";

const menuItems = [
  { label: "Trang chủ", icon: Home, href: "#" },
>>>>>>> f932458
  { label: "Sản phẩm", icon: Package, href: "#" },
  { label: "Khuyến mãi", icon: Gift, href: "#" },
  { label: "Tin tức", icon: Newspaper, href: "#" },
  { label: "Bảo hành", icon: ShieldCheck, href: "#" },
  { label: "Thanh toán", icon: CreditCard, href: "#" },
];

<<<<<<< HEAD
interface MenuBarProps {
  isScrolled: boolean;
  categories?: any[];
  selectedCategory?: string | null;
  onSelectCategory?: (slug: string | null) => void;
}

export default function MenuBar({ isScrolled, categories: propsCategories, selectedCategory: propsSelectedCategory, onSelectCategory }: MenuBarProps) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [hoveredCategorySlug, setHoveredCategorySlug] = useState<string | null>(null);

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
    const cats = propsCategories || fetchedCategories;
    return cats.map(c => ({
      ...c,
      slug: c.slug || slugify(c.name)
    }));
  }, [propsCategories, fetchedCategories]);

  // Determine which category's products to show
  const activeHoveredSlug = hoveredCategorySlug !== null ? hoveredCategorySlug : (propsSelectedCategory || (categories.length > 0 ? categories[0].slug : null));

  const filteredProducts = useMemo(() => {
    if (activeHoveredSlug === null) {
      return allProducts.slice(0, 6).map((p: any) => ({
        ...p,
        id: String(p.id),
        category_id: p.category_id ?? null,
        created_at: p.created_at ?? new Date().toISOString(),
        full_description: null,
        is_featured: false,
        purchase_rules: null,
      }));
    }
    
    const category = categories.find(c => c.slug === activeHoveredSlug);
    if (!category) return [];
    
    let filtered: any[] = [];
    
    // 1. Try matching via product_ids array if present
    if (category.product_ids && category.product_ids.length > 0) {
      const productIds = new Set(category.product_ids.map(String));
      filtered = allProducts.filter(p => productIds.has(String(p.id)));
    }
    
    // 2. Fallback: match via product.category_id if available
    if (filtered.length === 0) {
      filtered = allProducts.filter((p: any) => String(p.category_id) === String(category.id));
    }
    
    return filtered.slice(0, 6).map((p: any) => ({
      ...p,
      id: String(p.id),
      category_id: p.category_id ?? null,
      created_at: p.created_at ?? new Date().toISOString(),
      full_description: null,
      is_featured: false,
      purchase_rules: null,
    }));
  }, [allProducts, categories, activeHoveredSlug]);

  const handleCategoryClick = (slug: string | null) => {
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new Event("popstate"));
    }
    setIsMegaMenuOpen(false);
  };

  const handleProductClick = (slug: string) => {
    window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
    window.dispatchEvent(new Event("popstate"));
    setIsMegaMenuOpen(false);
  };

  return (
    <nav 
      className="relative z-40 border-b border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-none"
      aria-label="Menu điều hướng chính"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex ${isScrolled ? "h-10" : "h-12"} items-center justify-center`}>
          {/* Category Button */}
          <div 
            className="relative group/mega flex-shrink-0"
            onMouseEnter={() => {
              if (window.innerWidth >= 640) setIsMegaMenuOpen(true);
            }}
            onMouseLeave={() => {
              if (window.innerWidth >= 640) {
                setIsMegaMenuOpen(false);
                setHoveredCategorySlug(null);
              }
            }}
          >
            <button 
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-blue-50/50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20"
              aria-label="Mở menu danh mục"
              aria-expanded={isMegaMenuOpen}
              aria-haspopup="true"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span>DANH MỤC</span>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover/mega:w-full dark:bg-blue-400" aria-hidden="true" />
            </button>

            {/* Mega Menu */}
            {isMegaMenuOpen && (
              <div 
                className="fixed inset-x-2 top-16 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300 dark:border-slate-800/50 dark:bg-slate-950 sm:absolute sm:inset-x-auto sm:left-0 sm:right-0 sm:top-full sm:mt-0 sm:w-[min(calc(100vw-1rem),880px)] md:w-[min(calc(100vw-2rem),900px)] lg:w-[min(calc(100vw-3rem),980px)] xl:w-[min(calc(100vw-4rem),1080px)] sm:max-w-[calc(100vw-1rem)] sm:flex-row sm:backdrop-blur-xl sm:dark:bg-slate-950/95 sm:h-[500px] lg:h-[550px] xl:h-[600px] sm:rounded-3xl"
                role="menu"
                aria-label="Menu danh mục sản phẩm"
                onMouseEnter={() => {
                  if (window.innerWidth >= 640) setIsMegaMenuOpen(true);
                }}
                onMouseLeave={() => {
                  if (window.innerWidth >= 640) {
                    setIsMegaMenuOpen(false);
                    setHoveredCategorySlug(null);
                  }
                }}
              >
                {/* Bridge area to prevent menu from closing when moving from button to menu */}
                <div className="hidden sm:block absolute -top-4 left-0 right-0 h-4" />
                {/* Mobile Header - Only visible on mobile */}
                <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-slate-800 sm:hidden">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Danh mục</h3>
                  <button onClick={() => setIsMegaMenuOpen(false)} className="rounded-lg bg-gray-100 p-2 dark:bg-slate-900">
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>

                {/* Left: Category List */}
                <aside className="max-h-[calc(100vh-10rem)] w-full overflow-y-auto border-r border-gray-100 bg-gray-50/50 p-1.5 sm:p-2 md:p-3 lg:p-4 xl:p-5 no-scrollbar dark:border-slate-800 dark:bg-slate-900/30 sm:h-full sm:max-h-none sm:w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] flex-shrink-0" aria-label="Danh sách danh mục">
                  <div className="mb-4 hidden px-2 sm:block">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Danh mục sản phẩm</h3>
                  </div>
                  <div className="space-y-1" role="list">
                    <button
                      onMouseEnter={() => setHoveredCategorySlug(null)}
                      onClick={() => handleCategoryClick(null)}
                      role="menuitem"
                      aria-label="Tất cả sản phẩm"
                      aria-current={activeHoveredSlug === null ? "page" : undefined}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl py-3 px-4 text-xs font-bold transition-all duration-200 ${
                        activeHoveredSlug === null
                          ? "bg-white text-blue-600 shadow-md dark:bg-slate-800 dark:shadow-blue-900/20"
                          : "text-gray-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeHoveredSlug === null ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-slate-900'}`}>
                        <LayoutGrid className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left">Tất cả sản phẩm</span>
                      <ChevronRight className={`h-3 w-3 transition-transform duration-300 ${activeHoveredSlug === null ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                    </button>

                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setHoveredCategorySlug(cat.slug)}
                        onClick={() => handleCategoryClick(cat.slug)}
                        role="menuitem"
                        aria-label={`Danh mục ${cat.name}`}
                        aria-current={activeHoveredSlug === cat.slug ? "page" : undefined}
                        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl py-3 px-4 text-xs font-bold transition-all duration-200 ${
                          activeHoveredSlug === cat.slug
                            ? "bg-white text-blue-600 shadow-md dark:bg-slate-800 dark:shadow-blue-900/20"
                            : "text-gray-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                        }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeHoveredSlug === cat.slug ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-slate-900'}`}>
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="flex-1 text-left">{cat.name}</span>
                        <ChevronRight className={`h-3 w-3 transition-transform duration-300 ${activeHoveredSlug === cat.slug ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                      </button>
                    ))}
                  </div>
                </aside>

                {/* Right: Product Grid */}
                <section className="hidden flex-1 overflow-y-auto overflow-x-hidden bg-white p-1.5 sm:p-2 md:p-3 lg:p-4 xl:p-5 no-scrollbar dark:bg-slate-950 sm:block sm:h-full min-w-0" aria-label="Sản phẩm trong danh mục">
                  <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8 flex flex-col gap-1.5 sm:gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 min-w-0 flex-1">
                      <div className="h-4 sm:h-5 md:h-6 lg:h-8 w-0.5 sm:w-1 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white truncate">
                          {activeHoveredSlug 
                            ? categories.find(c => c.slug === activeHoveredSlug)?.name 
                            : "Tất cả sản phẩm"}
                        </h3>
                        <p className="mt-0.5 text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                          Gợi ý cho bạn
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCategoryClick(activeHoveredSlug)}
                      className="group flex cursor-pointer items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 rounded-full bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400 whitespace-nowrap flex-shrink-0"
                    >
                      Xem tất cả <ArrowRight className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 lg:h-3 lg:w-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4">
                    {filteredProducts.map((product: any) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        slug={product.slug}
                        name={product.name}
                        description={product.description}
                        image_url={product.image_url}
                        base_price={product.base_price}
                        discount_percentage={product.discount_percentage}
                        sales_count={product.sales_count}
                        average_rating={product.average_rating}
                        package_count={product.package_count}
                        category_id={product.category_id ?? null}
                        created_at={product.created_at ?? new Date().toISOString()}
                        full_description={product.full_description ?? null}
                        is_featured={product.is_featured ?? false}
                        purchase_rules={product.purchase_rules ?? null}
                        isCompact={true}
                        onClick={() => handleProductClick(product.slug)}
                      />
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12 sm:py-20 text-gray-400 dark:text-slate-600" role="status" aria-live="polite">
                        <Package className="h-12 w-12 sm:h-16 sm:w-16 mb-4 opacity-10" aria-hidden="true" />
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-2">
                          Không có sản phẩm trong mục này
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-slate-500">
                          Vui lòng thử chọn danh mục khác
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Scrolling Menu Items */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar sm:gap-4 ml-2 sm:ml-4">
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
=======
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
>>>>>>> f932458
        </div>
      </div>
    </nav>
  );
}
