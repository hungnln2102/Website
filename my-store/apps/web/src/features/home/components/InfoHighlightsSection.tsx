"use client";

import type { LucideIcon } from "lucide-react";
import {
  Headphones,
  ShieldCheck,
  Workflow,
} from "lucide-react";

type HighlightCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  lightIconBg: string;
  darkIconBg: string;
  lightIconColor: string;
  darkIconColor: string;
};

const highlightCards: HighlightCard[] = [
  {
    title: "Bản quyền chính hãng",
    description: "Sản phẩm ổn định, rõ nguồn gốc và phù hợp cho học tập lẫn làm việc.",
    icon: ShieldCheck,
    accentClass:
      "from-blue-500/18 via-sky-400/8 to-transparent dark:from-blue-500/20 dark:via-blue-400/10 dark:to-transparent",
    lightIconBg: "bg-blue-100/90",
    darkIconBg: "dark:bg-blue-500/15",
    lightIconColor: "text-blue-600",
    darkIconColor: "dark:text-blue-300",
  },
  {
    title: "Mua nhanh, dùng gọn",
    description: "Tìm đúng gói nhanh hơn, ít thao tác hơn và dễ so sánh trước khi mua.",
    icon: Workflow,
    accentClass:
      "from-emerald-500/18 via-teal-400/8 to-transparent dark:from-emerald-500/20 dark:via-teal-400/10 dark:to-transparent",
    lightIconBg: "bg-emerald-100/90",
    darkIconBg: "dark:bg-emerald-500/15",
    lightIconColor: "text-emerald-600",
    darkIconColor: "dark:text-emerald-300",
  },
  {
    title: "Hỗ trợ rõ ràng",
    description: "Các mục hướng dẫn và theo dõi đơn giúp xử lý vấn đề sau mua mạch lạc hơn.",
    icon: Headphones,
    accentClass:
      "from-violet-500/18 via-fuchsia-400/8 to-transparent dark:from-violet-500/20 dark:via-fuchsia-400/10 dark:to-transparent",
    lightIconBg: "bg-violet-100/90",
    darkIconBg: "dark:bg-violet-500/15",
    lightIconColor: "text-violet-600",
    darkIconColor: "dark:text-violet-300",
  },
];

export function InfoHighlightsSection() {
  return (
    <section
      className="relative mx-auto mt-3 max-w-[78rem] overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] px-4 py-7 shadow-[0_18px_48px_rgba(15,23,42,0.07)] sm:mt-4 sm:px-6 sm:py-8 lg:px-8 dark:border-slate-800/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))] dark:shadow-[0_24px_60px_rgba(2,6,23,0.34)]"
      style={{ contentVisibility: "auto", containIntrinsicSize: "560px" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_64%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-6 h-28 w-28 rounded-full bg-blue-500/8 blur-3xl dark:bg-blue-500/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-8 top-12 h-24 w-24 rounded-full bg-violet-500/8 blur-3xl dark:bg-violet-500/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
          Tại sao chọn Mavryk Premium Store?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
          Chúng tôi sắp xếp sản phẩm, thông tin và hỗ trợ theo hướng dễ tìm, dễ hiểu và
          dễ ra quyết định hơn ngay từ lần truy cập đầu tiên.
        </p>
      </div>

      <div className="relative mt-7 grid gap-3 md:grid-cols-3">
        {highlightCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.1)] dark:border-slate-800/80 dark:bg-slate-950/72 dark:shadow-[0_14px_28px_rgba(2,6,23,0.24)] dark:hover:shadow-[0_20px_38px_rgba(2,6,23,0.32)]"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${card.accentClass}`}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent dark:via-slate-600/60"
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/70 ${card.lightIconBg} ${card.darkIconBg} shadow-[0_8px_18px_rgba(15,23,42,0.08)] dark:border-white/5 dark:shadow-[0_8px_18px_rgba(2,6,23,0.2)]`}
                >
                  <Icon
                    className={`h-5 w-5 ${card.lightIconColor} ${card.darkIconColor}`}
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-[1.35rem] font-black tracking-tight text-slate-950 sm:text-[1.45rem] dark:text-white">
                    {card.title}
                  </h3>
                </div>
              </div>

              <div className="relative mt-4">
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {card.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
