"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Copy,
  Facebook,
  Mail,
  MessageCircleMore,
  Send,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { APP_CONFIG, ROUTES } from "@/lib/constants";

type ExternalAction = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentClass: string;
};

type InternalAction = {
  label: string;
  href: string;
};

const shareSummary = "Mavryk Premium Store - phần mềm bản quyền chính hãng";

function navigateAppRoute(href: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function HomeSupportShareSection() {
  const shareUrl = APP_CONFIG.url.endsWith("/") ? APP_CONFIG.url : `${APP_CONFIG.url}/`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedSummary = encodeURIComponent(shareSummary);

  const shareActions: ExternalAction[] = [
    {
      label: "Chia sẻ lên Facebook",
      description: "Đăng link cửa hàng lên Facebook để người khác mở nhanh ngay từ bài viết.",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
      accentClass:
        "border-blue-200/80 bg-blue-50/80 text-blue-700 hover:border-blue-300 hover:bg-blue-100/90 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/15",
    },
    {
      label: "Gửi qua Telegram",
      description: "Chia sẻ bằng Telegram khi cần gửi nhanh cho khách hoặc cộng tác viên.",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedSummary}`,
      icon: Send,
      accentClass:
        "border-sky-200/80 bg-sky-50/80 text-sky-700 hover:border-sky-300 hover:bg-sky-100/90 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/15",
    },
    {
      label: "Gửi qua Email",
      description: "Tạo email kèm link trang chủ để giới thiệu cửa hàng theo ngữ cảnh rõ ràng hơn.",
      href: `mailto:?subject=${encodedSummary}&body=${encodeURIComponent(
        `Mời bạn xem ${shareSummary}: ${shareUrl}`
      )}`,
      icon: Mail,
      accentClass:
        "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/90 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15",
    },
  ];

  const supportActions: ExternalAction[] = [
    {
      label: "Nhắn Zalo hỗ trợ",
      description: "Trao đổi nhanh với cửa hàng khi cần tư vấn gói hoặc xử lý sau mua.",
      href: "https://zalo.me/0378304963",
      icon: MessageCircleMore,
      accentClass:
        "border-indigo-200/80 bg-indigo-50/80 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100/90 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/15",
    },
    {
      label: "Gửi email cho cửa hàng",
      description: "Phù hợp với yêu cầu cần mô tả chi tiết hoặc cần lưu lại lịch sử trao đổi.",
      href: "mailto:support@mavrykpremium.store",
      icon: Mail,
      accentClass:
        "border-slate-200/80 bg-slate-50/90 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800",
    },
  ];

  const internalActions: InternalAction[] = [
    {
      label: "Tìm hiểu về Mavryk Premium Store",
      href: ROUTES.about,
    },
    {
      label: "Đọc hướng dẫn Adobe",
      href: ROUTES.adobeGuide,
    },
    {
      label: "Mở danh mục phần mềm đầy đủ",
      href: ROUTES.allProducts,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép link trang chủ");
    } catch {
      toast.error("Không thể sao chép link. Hãy thử lại trong trình duyệt.");
    }
  };

  return (
    <section
      id="tin-tuc"
      className="mt-5 mb-4 sm:mt-6 sm:mb-6"
      aria-labelledby="home-support-share-heading"
      style={{ contentVisibility: "auto", containIntrinsicSize: "960px" }}
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] dark:border-slate-800/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))] dark:shadow-[0_24px_60px_rgba(2,6,23,0.34)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-blue-600/90 dark:text-blue-300">
              Tin tức và hỗ trợ
            </p>
            <h2
              id="home-support-share-heading"
              className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl"
            >
              Chia sẻ cửa hàng và mở nhanh các điểm hỗ trợ quan trọng
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Khối này bổ sung các tuỳ chọn chia sẻ thực sự cho trang chủ, đồng thời gom
              các lối tắt nội bộ và hỗ trợ để người dùng lẫn crawler nhìn rõ cấu trúc điều
              hướng hơn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>Sao chép link trang chủ</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.95fr]">
          <article className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-800/80 dark:bg-slate-950/72 dark:shadow-[0_14px_28px_rgba(2,6,23,0.24)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Share2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[1.35rem] font-black tracking-tight text-slate-950 dark:text-white">
                  Chia sẻ trên mạng xã hội
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Mỗi liên kết mở đúng hành động chia sẻ thay vì chỉ dẫn tới trang hồ sơ.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {shareActions.map((action) => {
                const Icon = action.icon;

                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${action.accentClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-base font-bold tracking-tight">{action.label}</p>
                    <p className="mt-2 text-sm leading-6 opacity-90">{action.description}</p>
                  </a>
                );
              })}
            </div>
          </article>

          <article
            id="lien-he"
            className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-slate-800/80 dark:bg-slate-950/72 dark:shadow-[0_14px_28px_rgba(2,6,23,0.24)]"
          >
            <h3 className="text-[1.35rem] font-black tracking-tight text-slate-950 dark:text-white">
              Hỗ trợ nhanh và điều hướng nội bộ
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Các liên kết dưới đây giúp người dùng đi thẳng tới điểm cần thiết thay vì phải
              dò nhiều lớp menu.
            </p>

            <div className="mt-5 grid gap-3">
              {supportActions.map((action) => {
                const Icon = action.icon;

                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${action.accentClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-base font-bold tracking-tight">{action.label}</p>
                        <p className="mt-1.5 text-sm leading-6 opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Lối tắt nội bộ
              </p>
              <div className="mt-3 grid gap-3">
                {internalActions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateAppRoute(action.href);
                    }}
                    className="inline-flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
