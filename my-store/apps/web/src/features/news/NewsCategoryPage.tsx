"use client";

import { useMemo } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MetaTags, StructuredData } from "@/components/SEO";
import SiteHeader from "@/components/SiteHeader";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { fetchProducts, fetchCategories, productsQueryKey, type CategoryDto } from "@/lib/api";
import { useAuth } from "@/features/auth/hooks";
import { BRANDING_ASSETS } from "@/lib/brandingAssets";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import { generateBreadcrumbSchema } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import { fetchPublishedArticles, mapPublicRowToNewsArticle } from "@/features/news/api/publicArticles.api";
import type { NewsArticle } from "@/features/news/data/newsArticles";

interface NewsCategoryPageProps {
  categorySlug: string;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function NewsCategoryPage({
  categorySlug,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: NewsCategoryPageProps) {
  const isScrolled = useScroll();
  const { user } = useAuth();

  const { data: products = [] } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const navigateAppRoute = (href: string) => {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryName =
    Array.from(new Set(newsArticles.map((article) => article.category))).find(
      (name) => slugify(name) === categorySlug
    ) || null;

  const categoryArticles = useMemo(() => {
    if (!categoryName) return [];
    return newsArticles.filter((article) => article.category === categoryName);
  }, [categoryName, newsArticles]);

  const seoMetadata = useMemo(
    () => ({
      title: `${categoryName || "Danh mục tin tức"} - ${APP_CONFIG.name}`,
      description: categoryName
        ? `Tổng quan các bài viết trong danh mục ${categoryName} tại ${APP_CONFIG.name}.`
        : "Không tìm thấy danh mục tin tức.",
      keywords: `${categoryName || "tin tức"}, danh mục tin tức, ${APP_CONFIG.name}`,
      url: categoryName
        ? `${APP_CONFIG.url}${ROUTES.newsCategory(categorySlug)}`
        : `${APP_CONFIG.url}${ROUTES.news}`,
      image: `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`,
      type: "website" as const,
    }),
    [categoryName, categorySlug]
  );

  const structuredData = useMemo(() => {
    const breadcrumb = generateBreadcrumbSchema([
      { name: "Trang chủ", url: `${APP_CONFIG.url}${ROUTES.home}` },
      { name: "Tin tức", url: `${APP_CONFIG.url}${ROUTES.news}` },
      {
        name: categoryName || "Danh mục",
        url: categoryName
          ? `${APP_CONFIG.url}${ROUTES.newsCategory(categorySlug)}`
          : `${APP_CONFIG.url}${ROUTES.news}`,
      },
    ]);

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Danh sách bài viết ${categoryName || "tin tức"}`,
      itemListElement: categoryArticles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${APP_CONFIG.url}${ROUTES.newsArticle(article.slug)}`,
        name: article.title,
      })),
    };

    return [breadcrumb, itemList];
  }, [categoryArticles, categoryName, categorySlug]);

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
          onLogoClick={() => navigateAppRoute(ROUTES.home)}
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
          onCategoryClick={(slug) => navigateAppRoute(ROUTES.category(slug))}
          omitNavActions
        />
        <MenuBar isScrolled={isScrolled} />
      </div>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={() => navigateAppRoute(ROUTES.news)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại trang tin tức
        </button>

        <header className="mt-5 mb-5">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {categoryName ? `Tổng quan danh mục ${categoryName}` : "Không tìm thấy danh mục"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {categoryName
              ? `Hiển thị toàn bộ bài viết thuộc danh mục ${categoryName}.`
              : "Danh mục bạn truy cập không tồn tại hoặc đã thay đổi đường dẫn."}
          </p>
        </header>

        {articlesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : articlesError ? (
          <p className="rounded-2xl border border-red-200/80 bg-white px-6 py-8 text-center text-slate-700 dark:border-red-900/40 dark:bg-slate-900 dark:text-slate-300">
            Không tải được danh sách tin.
          </p>
        ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryArticles.map((article) => (
            <article
              key={article.id}
              className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_12px_24px_rgba(2,6,23,0.24)]"
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${article.accentClass}`} aria-hidden="true" />
              <div
                className={`relative w-full overflow-hidden ${
                  article.coverImageUrl
                    ? "bg-slate-900/90 dark:bg-slate-950"
                    : `flex min-h-[7.5rem] items-center justify-center bg-gradient-to-br ${article.accentClass}`
                }`}
                aria-hidden="true"
              >
                {article.coverImageUrl ? (
                  <img
                    src={article.coverImageUrl}
                    alt=""
                    className="news-card-cover-img"
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
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {article.publishedLabel}
                  </span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-base font-black leading-6 tracking-tight text-slate-950 dark:text-white">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {article.summary}
                </p>
                <button
                  type="button"
                  onClick={() => navigateAppRoute(ROUTES.newsArticle(article.slug))}
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <span>Xem chi tiết bài viết</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
