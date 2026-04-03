'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { BRANDING_ASSETS } from '@/lib/brandingAssets';
import { ROUTES } from '@/lib/constants';
import {
  fetchPublishedArticles,
  mapRowToHomeArticle,
  type HomeNewsArticle,
} from '@/features/news/api/publicArticles.api';

function navigateAppRoute(href: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function HomeSupportShareSection() {
  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ['public-articles-home'],
    queryFn: () => fetchPublishedArticles(6),
    staleTime: 60_000,
  });

  const articles: HomeNewsArticle[] = useMemo(() => rows.map(mapRowToHomeArticle), [rows]);

  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (articles.length && activeArticleId === null) {
      setActiveArticleId(articles[0].id);
    }
  }, [articles, activeArticleId]);

  const activeArticle =
    articles.find((a) => a.id === activeArticleId) ?? articles[0] ?? null;

  const listArticles = articles.slice(0, 5);

  const handleSelectArticle = useCallback(
    (id: string) => {
      if (id === activeArticleId) return;
      setIsSliding(true);
      setTimeout(() => {
        setActiveArticleId(id);
        setTimeout(() => setIsSliding(false), 20);
      }, 200);
    },
    [activeArticleId],
  );

  if (isLoading) {
    return (
      <section
        id="tin-tuc"
        className="mt-5 mb-4 sm:mt-6 sm:mb-6"
        aria-busy="true"
        aria-label="Đang tải tin tức"
      >
        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-slate-100/80 p-4 dark:border-slate-800/70 dark:bg-slate-900/50 sm:p-5">
          <div className="h-3.5 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:items-start xl:gap-5 2xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[min(100%,32rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-800/70 dark:bg-slate-900/40 sm:max-w-[min(100%,34rem)] 2xl:max-w-[min(100%,36rem)] xl:mx-0">
              <div className="aspect-video w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2 px-3.5 py-3 sm:px-4">
                <div className="h-2.5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-full max-w-[22rem] animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-9 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/70">
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 px-3 py-3.5 sm:px-4">
                    <div className="h-3 w-5 shrink-0 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-10 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !activeArticle || listArticles.length === 0) {
    return (
      <section id="tin-tuc" className="mt-5 mb-4 sm:mt-6 sm:mb-6">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 px-6 py-8 text-center text-sm text-slate-600 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-400">
          {isError
            ? 'Không tải được tin tức. Vui lòng thử lại sau.'
            : 'Chưa có bài viết nào. Hãy đăng bài trên trang quản trị để hiển thị tại đây.'}
        </div>
      </section>
    );
  }

  return (
    <section
      id="tin-tuc"
      className="mt-5 mb-4 sm:mt-6 sm:mb-6"
      aria-labelledby="home-support-share-heading"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '480px' }}
    >
      <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] p-3 shadow-[0_18px_48px_rgba(15,23,42,0.07)] sm:rounded-[24px] sm:p-5 lg:p-6 dark:border-slate-800/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))] dark:shadow-[0_24px_60px_rgba(2,6,23,0.34)]">
        <div className="flex items-end justify-between gap-4">
          <p
            id="home-support-share-heading"
            className="text-xs font-bold tracking-[0.26em] text-blue-600/90 uppercase dark:text-blue-300"
          >
            Tin tức và hỗ trợ
          </p>
          <button
            type="button"
            onClick={() => navigateAppRoute(ROUTES.news)}
            className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Xem tất cả
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:items-start xl:gap-5 2xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
          <article className="w-full max-w-[min(100%,32rem)] justify-self-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:max-w-[min(100%,34rem)] 2xl:max-w-[min(100%,36rem)] xl:justify-self-start dark:border-slate-800/80 dark:bg-slate-950/72 dark:shadow-[0_14px_28px_rgba(2,6,23,0.24)]">
            <div
              ref={slideRef}
              className={`transition-all duration-200 ease-in-out ${
                isSliding ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
              }`}
            >
              {/* Khối trên: ảnh bìa + logo shop góc phải */}
              <button
                type="button"
                onClick={() => navigateAppRoute(ROUTES.newsArticle(activeArticle.slug))}
                className="group relative block w-full overflow-hidden text-left"
                aria-label={`Xem chi tiết bài viết ${activeArticle.title}`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900/40 dark:bg-slate-950/60">
                  {activeArticle.coverImageUrl ? (
                    <img
                      src={activeArticle.coverImageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 1280px) 640px, (min-width: 640px) 90vw, 100vw"
                      className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                    />
                  ) : (
                    <>
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${activeArticle.accentClass}`}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.4),transparent_42%)]"
                        aria-hidden="true"
                      />
                      <img
                        src={BRANDING_ASSETS.logo512}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 m-auto h-28 w-28 object-contain opacity-25 sm:h-32 sm:w-32"
                      />
                    </>
                  )}
                  {/* Logo shop — góc phải (dưới ảnh), luôn hiển thị */}
                  <img
                    src={BRANDING_ASSETS.logoTransparent}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute right-2 bottom-2 z-10 h-11 w-11 object-contain opacity-95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:right-2.5 sm:bottom-2.5 sm:h-12 sm:w-12"
                  />
                </div>
              </button>

              {/* Khối dưới: tóm tắt + CTA */}
              <div className="border-t border-slate-200/80 bg-white/95 px-3.5 py-3 sm:px-4 sm:py-3.5 dark:border-slate-800/80 dark:bg-slate-950/85">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:bg-slate-800/80 dark:text-slate-300">
                    {activeArticle.category}
                  </span>
                  <span className="rounded-full border border-slate-200/90 px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase dark:border-slate-600/80 dark:text-slate-400">
                    Nổi bật
                  </span>
                  <time
                    dateTime={activeArticle.publishedAt}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700/70 dark:text-slate-300"
                  >
                    <CalendarDays className="h-3 w-3" aria-hidden="true" />
                    <span>{activeArticle.publishedLabel}</span>
                  </time>
                </div>

                <p className="mt-1.5 text-[10px] font-bold tracking-[0.22em] text-slate-400 uppercase dark:text-slate-500">
                  {activeArticle.visualLabel}
                </p>
                <h3 className="mt-1 text-base font-black leading-snug tracking-tight text-slate-950 sm:text-[1.05rem] dark:text-white">
                  {activeArticle.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeArticle.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigateAppRoute(ROUTES.newsArticle(activeArticle.slug))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    <span>Xem chi tiết bài viết</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/40">
            <p className="border-b border-slate-200/70 px-3 py-2.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase sm:px-4 dark:border-slate-800/80 dark:text-slate-500">
              Bài khác
            </p>
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
              {listArticles.map((article, index) => {
                const isActive = article.id === activeArticle.id;

                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleSelectArticle(article.id)}
                    aria-pressed={isActive}
                    aria-label={`${article.title}. ${article.publishedLabel}, ${article.category}.`}
                    className={`group relative flex w-full items-start gap-3 px-3 py-3 text-left transition-colors sm:px-4 sm:py-3.5 ${
                      isActive
                        ? 'bg-blue-500/[0.07] dark:bg-blue-400/[0.09]'
                        : 'hover:bg-slate-50/90 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`select-none pt-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-300'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-sm font-semibold leading-snug tracking-tight ${
                        isActive
                          ? 'text-slate-950 dark:text-white'
                          : 'text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'
                      }`}
                    >
                      {article.title}
                    </span>
                    <ArrowRight
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'translate-x-0 text-blue-500 opacity-100 dark:text-blue-300'
                          : 'text-slate-400 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-70'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div id="lien-he" className="sr-only" aria-hidden="true" />
      </div>
    </section>
  );
}
