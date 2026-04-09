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
import {
  fetchPublishedArticleBySlug,
  fetchPublishedArticles,
  mapPublicRowToNewsArticle,
} from "@/features/news/api/publicArticles.api";
import type { NewsArticle } from "@/features/news/data/newsArticles";

function articleBodyPlainText(article: NewsArticle): string {
  if (article.contentHtml) {
    return article.contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return article.content.join(" ");
}

function absoluteOgImage(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = APP_CONFIG.url.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

interface NewsDetailPageProps {
  slug: string;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function NewsDetailPage({
  slug,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: NewsDetailPageProps) {
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

  const {
    data: article,
    isLoading: articleLoading,
    isError: articleError,
  } = useQuery({
    queryKey: ["public-article", slug],
    queryFn: () => fetchPublishedArticleBySlug(slug),
    staleTime: 60_000,
  });

  const { data: listRows = [] } = useQuery({
    queryKey: ["public-articles", "related"],
    queryFn: () => fetchPublishedArticles(20),
    staleTime: 60_000,
  });

  const relatedArticles = useMemo(() => {
    return listRows
      .map(mapPublicRowToNewsArticle)
      .filter((item) => item.slug !== slug)
      .slice(0, 3);
  }, [listRows, slug]);

  const handleLogoClick = () => navigateAppRoute(ROUTES.home);

  const handleCategoryClick = (categorySlug: string) => navigateAppRoute(ROUTES.category(categorySlug));

  const seoMetadata = useMemo(() => {
    if (articleLoading) {
      return {
        title: `Tin tức - ${APP_CONFIG.name}`,
        description: "Đang tải bài viết…",
        keywords: "tin tức, bài viết, Mavryk Premium Store",
        url: `${APP_CONFIG.url}${ROUTES.news}`,
        image: `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`,
        type: "website" as const,
      };
    }
    if (!article) {
      return {
        title: `Bài viết không tồn tại - ${APP_CONFIG.name}`,
        description:
          "Bài viết bạn đang tìm không tồn tại hoặc đã được cập nhật đường dẫn trong chuyên mục tin tức.",
        keywords: "tin tức, bài viết, Mavryk Premium Store",
        url: `${APP_CONFIG.url}${ROUTES.newsArticle(slug)}`,
        image: `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`,
        type: "website" as const,
        robots: "noindex, follow" as const,
      };
    }

    const cover = article.coverImageUrl
      ? absoluteOgImage(article.coverImageUrl)
      : `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`;

    return {
      title: `${article.title} - ${APP_CONFIG.name}`,
      description: article.summary,
      keywords: `${article.category}, tin tức, ${APP_CONFIG.name}`,
      url: `${APP_CONFIG.url}${ROUTES.newsArticle(article.slug)}`,
      image: cover,
      type: "website" as const,
    };
  }, [article, articleLoading]);

  const structuredData = useMemo(() => {
    const breadcrumb = generateBreadcrumbSchema([
      { name: "Trang chủ", url: `${APP_CONFIG.url}${ROUTES.home}` },
      { name: "Tin tức", url: `${APP_CONFIG.url}${ROUTES.news}` },
      {
        name: article?.title || "Chi tiết bài viết",
        url: article
          ? `${APP_CONFIG.url}${ROUTES.newsArticle(article.slug)}`
          : `${APP_CONFIG.url}${ROUTES.news}`,
      },
    ]);

    if (articleLoading || !article) {
      return [breadcrumb];
    }

    const newsArticleSchema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: article.summary,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      author: {
        "@type": "Organization",
        name: APP_CONFIG.name,
      },
      publisher: {
        "@type": "Organization",
        name: APP_CONFIG.name,
        logo: {
          "@type": "ImageObject",
          url: `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${APP_CONFIG.url}${ROUTES.newsArticle(article.slug)}`,
      },
      image: article.coverImageUrl
        ? [absoluteOgImage(article.coverImageUrl)]
        : [`${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`],
      articleSection: article.category,
      articleBody: articleBodyPlainText(article),
    };

    return [newsArticleSchema, breadcrumb];
  }, [article, articleLoading]);

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
          omitNavActions
        />
        <MenuBar isScrolled={isScrolled} />
      </div>

      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={() => navigateAppRoute(ROUTES.news)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại trang tin tức
        </button>

        {articleLoading ? (
          <section className="mt-6 space-y-4" aria-busy="true" aria-label="Đang tải bài viết">
            <div className="h-10 w-full max-w-2xl animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </section>
        ) : articleError ? (
          <section className="mt-6 rounded-2xl border border-red-200/80 bg-white p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Không tải được bài viết</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.
            </p>
            <button
              type="button"
              onClick={() => navigateAppRoute(ROUTES.news)}
              className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
            >
              Về trang tin tức
            </button>
          </section>
        ) : !article ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy bài viết</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bài viết bạn đang tìm không tồn tại hoặc đã được cập nhật đường dẫn.
            </p>
            <button
              type="button"
              onClick={() => navigateAppRoute(ROUTES.news)}
              className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
            >
              Về trang tin tức
            </button>
          </section>
        ) : (
          <>
            <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-[0_20px_40px_rgba(2,6,23,0.35)]">
              <div className={`h-2 w-full bg-gradient-to-r ${article.accentClass}`} aria-hidden="true" />
              {article.coverImageUrl ? (
                <div className="w-full overflow-hidden bg-slate-100 dark:bg-slate-900/90">
                  <img
                    src={article.coverImageUrl}
                    alt=""
                    className="news-card-cover-img"
                    loading="eager"
                  />
                </div>
              ) : null}
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                    {article.category}
                  </span>
                  <time
                    dateTime={article.publishedAt}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300"
                  >
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {article.publishedLabel}
                  </time>
                </div>
                <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                  {article.title}
                </h1>
                <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{article.summary}</p>
                {article.contentHtml ? (
                  <div
                    className="news-article-body mt-6 space-y-4 text-sm leading-8 text-slate-700 sm:text-base dark:text-slate-200 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                  />
                ) : (
                  <div className="mt-6 space-y-4 text-sm leading-8 text-slate-700 sm:text-base dark:text-slate-200">
                    {article.content.map((paragraph) => (
                      <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Bài viết liên quan</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {relatedArticles.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-[0_14px_24px_rgba(2,6,23,0.3)]"
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${item.accentClass}`} aria-hidden="true" />
                    <div
                      className={`relative w-full overflow-hidden ${
                        item.coverImageUrl
                          ? "bg-slate-900/90 dark:bg-slate-950"
                          : `flex min-h-[7.5rem] items-center justify-center bg-gradient-to-br ${item.accentClass}`
                      }`}
                      aria-hidden="true"
                    >
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt=""
                          className="news-card-cover-img"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.35),transparent_42%)]" />
                          <img
                            src={BRANDING_ASSETS.logoTransparent}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            className="absolute right-3 bottom-2 h-14 w-14 object-contain opacity-85"
                          />
                        </>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                          {item.category}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" />
                          {item.publishedLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-sm font-black leading-6 text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                        {item.summary}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateAppRoute(ROUTES.newsArticle(item.slug))}
                        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        Xem chi tiết
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
