"use client";

import { useMemo, useState } from "react";
import { Newspaper, ArrowRight, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MetaTags, StructuredData } from "@/components/SEO";
import SiteHeader from "@/components/SiteHeader";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, type CategoryDto } from "@/lib/api";
import { BRANDING_ASSETS } from "@/lib/brandingAssets";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import { generateBreadcrumbSchema } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import { fetchPublishedArticles, mapPublicRowToNewsArticle } from "@/features/news/api/publicArticles.api";
import type { NewsArticle } from "@/features/news/data/newsArticles";

interface NewsPageProps {
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function NewsPage({ onProductClick, searchQuery, setSearchQuery }: NewsPageProps) {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("Tất cả");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const {
    data: articleRows = [],
    isLoading: articlesLoading,
    isError: articlesError,
  } = useQuery({
    queryKey: ["public-articles", "news-page"],
    queryFn: () => fetchPublishedArticles(40),
    staleTime: 60_000,
  });

  const newsArticles: NewsArticle[] = useMemo(
    () => articleRows.map(mapPublicRowToNewsArticle),
    [articleRows]
  );

  const navigateAppRoute = (href: string) => {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogoClick = () => navigateAppRoute(ROUTES.home);

  const handleCategoryClick = (slug: string) => navigateAppRoute(ROUTES.category(slug));

  const categoryOptions = useMemo(
    () => ["Tất cả", ...Array.from(new Set(newsArticles.map((article) => article.category)))],
    [newsArticles]
  );

  const groupedArticles = useMemo(
    () =>
      newsArticles.reduce<Record<string, NewsArticle[]>>((acc, article) => {
        if (!acc[article.category]) {
          acc[article.category] = [];
        }
        acc[article.category].push(article);
        return acc;
      }, {}),
    [newsArticles]
  );

  const visibleCategories = useMemo(() => {
    if (activeCategory === "Tất cả") {
      return categoryOptions.filter((category) => category !== "Tất cả");
    }
    return [activeCategory];
  }, [activeCategory, categoryOptions]);

  const seoMetadata = useMemo(() => {
    const isAll = activeCategory === "Tất cả";
    const title = isAll
      ? `Tin tức - ${APP_CONFIG.name}`
      : `Tin tức ${activeCategory} - ${APP_CONFIG.name}`;
    const description = isAll
      ? "Trang tin tức tổng hợp hướng dẫn, cập nhật vận hành, bài viết danh mục và khuyến mãi mới nhất từ Mavryk Premium Store."
      : `Danh mục tin tức ${activeCategory} tại Mavryk Premium Store, cập nhật bài viết mới và thông tin quan trọng cho khách hàng.`;

    return {
      title,
      description,
      keywords:
        "tin tức phần mềm, hướng dẫn sử dụng, cập nhật khuyến mãi, bài viết Mavryk Premium Store",
      url: `${APP_CONFIG.url}${ROUTES.news}`,
      image: `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`,
      type: "website" as const,
    };
  }, [activeCategory]);

  const structuredData = useMemo(() => {
    const breadcrumb = generateBreadcrumbSchema([
      { name: "Trang chủ", url: `${APP_CONFIG.url}${ROUTES.home}` },
      { name: "Tin tức", url: `${APP_CONFIG.url}${ROUTES.news}` },
    ]);

    const visibleArticles = visibleCategories.flatMap((category) =>
      (groupedArticles[category] ?? []).slice(0, 4)
    );

    const dedupedVisibleArticles = visibleArticles.filter(
      (article, index, array) =>
        array.findIndex((candidate) => candidate.slug === article.slug) === index
    );

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Danh sách bài viết tin tức",
      itemListElement: dedupedVisibleArticles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${APP_CONFIG.url}${ROUTES.newsArticle(article.slug)}`,
        name: article.title,
      })),
    };

    const collectionPage = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoMetadata.title,
      description: seoMetadata.description,
      url: `${APP_CONFIG.url}${ROUTES.news}`,
    };

    return [collectionPage, itemList, breadcrumb];
  }, [groupedArticles, seoMetadata.description, seoMetadata.title, visibleCategories]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MetaTags metadata={seoMetadata} />
      <StructuredData data={structuredData} />
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/5 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={handleLogoClick}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            image_url: product.image_url,
            base_price: product.base_price,
            discount_percentage: product.discount_percentage,
          }))}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          }))}
          onProductClick={onProductClick}
          onCategoryClick={handleCategoryClick}
          user={user}
          onLogout={logout}
        />
        <MenuBar
          isScrolled={isScrolled}
          categories={categories as CategoryDto[]}
          selectedCategory={null}
          onSelectCategory={handleCategoryClick}
        />
      </div>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold tracking-[0.2em] text-blue-700 uppercase dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
            <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
            Tin tức
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Cập nhật mới nhất từ Mavryk Premium Store
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
            Tổng hợp bài viết hướng dẫn, thông báo vận hành và cập nhật danh mục để bạn theo dõi nhanh các thay
            đổi quan trọng trước khi mua hoặc gia hạn dịch vụ.
          </p>
        </header>

        {articlesLoading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Đang tải tin tức">
            <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        ) : articlesError ? (
          <p className="rounded-2xl border border-red-200/80 bg-white px-6 py-8 text-center text-slate-700 dark:border-red-900/40 dark:bg-slate-900 dark:text-slate-300">
            Không tải được danh sách tin. Vui lòng thử lại sau.
          </p>
        ) : newsArticles.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Chưa có bài viết nào. Hãy đăng bài trên trang quản trị để hiển thị tại đây.
          </p>
        ) : (
          <>
        <section className="mb-6 flex flex-wrap gap-2 sm:mb-8">
          {categoryOptions.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        <div className="space-y-8">
          {visibleCategories.map((category) => (
            <section key={category}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{category}</h2>
                <button
                  type="button"
                  onClick={() => navigateAppRoute(ROUTES.newsCategory(slugify(category)))}
                  className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Xem tất cả
                </button>
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${
                  (() => {
                    const count = Math.min((groupedArticles[category] ?? []).length, 4);
                    if (count <= 1) return '';
                    if (count === 2) return 'sm:grid-cols-2';
                    if (count === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
                    return 'sm:grid-cols-2 lg:grid-cols-4';
                  })()
                }`}
              >
                {(groupedArticles[category] ?? []).slice(0, 4).map((article) => (
                  <article
                    key={article.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_12px_24px_rgba(2,6,23,0.24)]"
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${article.accentClass}`} aria-hidden="true" />
                    <div
                      className={`relative h-30 w-full overflow-hidden ${
                        article.coverImageUrl
                          ? 'bg-slate-900/90 dark:bg-slate-950'
                          : `bg-gradient-to-br ${article.accentClass}`
                      }`}
                      aria-hidden="true"
                    >
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt=""
                          className="h-full w-full object-contain object-center"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.34),transparent_42%)]" />
                          <img
                            src={BRANDING_ASSETS.logoTransparent}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            className="absolute right-3 bottom-2 h-16 w-16 object-contain opacity-85"
                          />
                        </>
                      )}
                    </div>
                    <div className="p-4 sm:p-4.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                          {article.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {article.publishedLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base font-black leading-6 tracking-tight text-slate-950 dark:text-white">
                        {article.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {article.summary}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateAppRoute(ROUTES.newsArticle(article.slug))}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        <span>Đọc bài viết</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
