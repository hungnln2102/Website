'use client';

import { useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { BRANDING_ASSETS } from '@/lib/brandingAssets';
import { ROUTES } from '@/lib/constants';

type NewsArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  href: string;
  publishedAt: string;
  publishedLabel: string;
  visualLabel: string;
  visualHeadline: string;
  visualDescription: string;
  accentClass: string;
};

const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'adobe-guide',
    category: 'Hướng dẫn',
    title: 'Hướng dẫn Adobe Creative Cloud cho người mới bắt đầu',
    summary:
      'Tổng hợp các bước đăng nhập, đổi mật khẩu, đăng xuất tài khoản và xử lý các tình huống cơ bản khi sử dụng Adobe Creative Cloud.',
    href: ROUTES.adobeGuide,
    publishedAt: '2026-03-28',
    publishedLabel: '28/03/2026',
    visualLabel: 'Mới cập nhật',
    visualHeadline: 'Adobe Guide',
    visualDescription:
      'Xem nhanh quy trình đăng nhập và xử lý lỗi cơ bản trước khi cần hỗ trợ sâu hơn.',
    accentClass:
      'from-cyan-500 via-sky-600 to-indigo-700 dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-800',
  },
  {
    id: 'about-store',
    category: 'Nội bộ',
    title: 'Cách Mavryk Premium Store xử lý đơn và hỗ trợ sau mua',
    summary:
      'Tóm tắt cách cửa hàng tiếp nhận đơn, gửi key, hỗ trợ kích hoạt và đồng hành với khách hàng trong quá trình sử dụng.',
    href: ROUTES.about,
    publishedAt: '2026-03-24',
    publishedLabel: '24/03/2026',
    visualLabel: 'Vận hành',
    visualHeadline: 'Hỗ trợ sau mua',
    visualDescription:
      'Đọc nhanh về quy trình xử lý đơn, gửi key và cách đội ngũ hỗ trợ đồng hành cùng khách hàng.',
    accentClass:
      'from-slate-800 via-slate-900 to-blue-950 dark:from-slate-800 dark:via-slate-950 dark:to-slate-900',
  },
  {
    id: 'all-products',
    category: 'Danh mục',
    title: 'Tổng hợp các nhóm phần mềm đang có trên cửa hàng',
    summary:
      'Mở nhanh danh mục tổng, tìm các nhóm sản phẩm đang bán và xem toàn bộ kho phần mềm bản quyền đang sẵn có.',
    href: ROUTES.allProducts,
    publishedAt: '2026-03-20',
    publishedLabel: '20/03/2026',
    visualLabel: 'Kho sản phẩm',
    visualHeadline: 'Danh mục đầy đủ',
    visualDescription:
      'Phù hợp khi bạn muốn xem tổng quan tất cả nhóm phần mềm trước khi đi sâu vào từng sản phẩm.',
    accentClass:
      'from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-800',
  },
  {
    id: 'best-selling',
    category: 'Bán chạy',
    title: 'Những gói phần mềm được khách hàng chọn mua nhiều nhất',
    summary:
      'Danh sách các gói đang có lượng quan tâm cao, giúp khách mới nhìn nhanh nhóm sản phẩm phổ biến trên cửa hàng.',
    href: ROUTES.bestSelling,
    publishedAt: '2026-03-16',
    publishedLabel: '16/03/2026',
    visualLabel: 'Được quan tâm',
    visualHeadline: 'Sản phẩm bán chạy',
    visualDescription:
      'Gợi ý các nhóm sản phẩm nổi bật để khách hàng mới tiết kiệm thời gian tìm kiếm.',
    accentClass:
      'from-amber-400 via-orange-500 to-rose-600 dark:from-amber-500 dark:via-orange-600 dark:to-rose-700',
  },
  {
    id: 'new-products',
    category: 'Sản phẩm mới',
    title: 'Cập nhật các sản phẩm mới vừa được đưa lên trang',
    summary:
      'Theo dõi nhanh những gói mới được bổ sung để khách hàng không bỏ lỡ các lựa chọn vừa cập nhật lên hệ thống.',
    href: ROUTES.newProducts,
    publishedAt: '2026-03-12',
    publishedLabel: '12/03/2026',
    visualLabel: 'Mới lên kệ',
    visualHeadline: 'Bộ sưu tập mới',
    visualDescription:
      'Tập trung vào những nhóm sản phẩm mới vừa lên trang để dễ so sánh và chọn mua.',
    accentClass:
      'from-violet-500 via-fuchsia-600 to-pink-600 dark:from-violet-600 dark:via-fuchsia-700 dark:to-pink-700',
  },
  {
    id: 'promotions',
    category: 'Khuyến mãi',
    title: 'Cách theo dõi các ưu đãi và đợt giảm giá đang có',
    summary:
      'Trang tổng hợp các ưu đãi đang diễn ra, giúp khách hàng xem nhanh các đợt giảm giá thay vì phải đi từng danh mục.',
    href: ROUTES.promotions,
    publishedAt: '2026-03-08',
    publishedLabel: '08/03/2026',
    visualLabel: 'Ưu đãi hiện tại',
    visualHeadline: 'Khuyến mãi đang mở',
    visualDescription:
      'Mở nhanh các ưu đãi đang hoạt động để khách hàng chọn đúng gói và đúng thời điểm mua.',
    accentClass:
      'from-rose-500 via-red-500 to-orange-600 dark:from-rose-600 dark:via-red-600 dark:to-orange-700',
  },
];

function navigateAppRoute(href: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function HomeSupportShareSection() {
  const [activeArticleId, setActiveArticleId] = useState(NEWS_ARTICLES[0].id);

  const activeArticle =
    NEWS_ARTICLES.find((article) => article.id === activeArticleId) ?? NEWS_ARTICLES[0];

  return (
    <section
      id="tin-tuc"
      className="mt-5 mb-4 sm:mt-6 sm:mb-6"
      aria-labelledby="home-support-share-heading"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] sm:p-6 lg:p-7 dark:border-slate-800/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))] dark:shadow-[0_24px_60px_rgba(2,6,23,0.34)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.26em] text-blue-600/90 uppercase dark:text-blue-300">
              Tin tức và hỗ trợ
            </p>
            <h2
              id="home-support-share-heading"
              className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white"
            >
              Bài viết nổi bật bên trái, danh sách bài mới nhất bên phải
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
              Khách hàng có thể xem nhanh một bài viết nổi bật, sau đó chọn tiếp các tiêu đề mới
              nhất ở cột bên phải để đổi nội dung xem trước và mở chi tiết khi cần.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold tracking-[0.22em] text-slate-500 uppercase dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300">
            <span>{NEWS_ARTICLES.length} bài viết</span>
            <span className="h-1 w-1 rounded-full bg-current/60" />
            <span>Mới nhất trước</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.14fr_0.86fr]">
          <article className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/92 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-800/80 dark:bg-slate-950/72 dark:shadow-[0_14px_28px_rgba(2,6,23,0.24)]">
            <button
              type="button"
              onClick={() => navigateAppRoute(activeArticle.href)}
              className="group relative block w-full overflow-hidden text-left"
              aria-label={`Xem chi tiết bài viết ${activeArticle.title}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${activeArticle.accentClass}`}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.35),transparent_38%)]"
                aria-hidden="true"
              />
              <img
                src={BRANDING_ASSETS.logo512}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 transition-transform duration-500 group-hover:scale-[1.14]"
              />
              <img
                src={BRANDING_ASSETS.logoTransparent}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute right-4 bottom-4 h-28 w-28 object-contain opacity-90 sm:h-32 sm:w-32"
              />

              <div className="relative flex min-h-[260px] flex-col justify-between px-5 pt-5 pb-6 sm:min-h-[320px] sm:px-6 sm:pt-6 sm:pb-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/18 px-3 py-1 text-[11px] font-bold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                    {activeArticle.category}
                  </span>
                  <span className="rounded-full border border-white/20 bg-slate-950/15 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-white/80 uppercase backdrop-blur-md">
                    Nổi bật
                  </span>
                </div>

                <div className="max-w-sm">
                  <p className="text-xs font-bold tracking-[0.28em] text-white/70 uppercase">
                    {activeArticle.visualLabel}
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-[1.9rem]">
                    {activeArticle.visualHeadline}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/82">
                    {activeArticle.visualDescription}
                  </p>
                </div>
              </div>
            </button>

            <div className="border-t border-slate-200/80 px-5 py-5 sm:px-6 sm:py-6 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-slate-600 uppercase dark:bg-slate-800/80 dark:text-slate-300">
                  {activeArticle.category}
                </span>
                <time
                  dateTime={activeArticle.publishedAt}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700/70 dark:text-slate-300"
                >
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{activeArticle.publishedLabel}</span>
                </time>
              </div>

              <h3 className="mt-4 text-[1.45rem] font-black tracking-tight text-slate-950 sm:text-[1.65rem] dark:text-white">
                {activeArticle.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.97rem] dark:text-slate-300">
                {activeArticle.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigateAppRoute(activeArticle.href)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <span>Xem chi tiết bài viết</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-800/80 dark:bg-slate-950/72 dark:shadow-[0_14px_28px_rgba(2,6,23,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[1.35rem] font-black tracking-tight text-slate-950 dark:text-white">
                  Danh sách bài viết
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Chọn tiêu đề bên dưới để đổi nội dung xem nhanh ở cột bên trái.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-300">
                Mới nhất trước
              </span>
            </div>

            <div className="mt-5 space-y-2.5">
              {NEWS_ARTICLES.map((article, index) => {
                const isActive = article.id === activeArticle.id;

                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setActiveArticleId(article.id)}
                    aria-pressed={isActive}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-blue-300 bg-blue-50/80 shadow-[0_10px_25px_rgba(59,130,246,0.12)] dark:border-blue-500/40 dark:bg-blue-500/10'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/55 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                          <span>{article.publishedLabel}</span>
                          <span className="h-1 w-1 rounded-full bg-current/60" />
                          <span>{article.category}</span>
                        </div>
                        <p
                          className={`mt-2 text-sm leading-6 font-semibold ${
                            isActive
                              ? 'text-slate-950 dark:text-white'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {article.title}
                        </p>
                      </div>

                      <ArrowRight
                        className={`mt-1 h-4 w-4 shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        </div>

        <div id="lien-he" className="sr-only" aria-hidden="true" />
      </div>
    </section>
  );
}
