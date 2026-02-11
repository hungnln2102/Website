"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    // Intro slide: giới thiệu Mavryk (SEO + brand)
    title: "Mavryk Premium Store - Cửa hàng phần mềm bản quyền chính hãng",
    description:
      "Mavryk Premium Store cung cấp key và tài khoản bản quyền cho Windows, Office, Adobe, Autodesk cùng nhiều phần mềm làm việc khác. Sản phẩm rõ nguồn gốc, hướng dẫn kích hoạt chi tiết, xử lý đơn nhanh và hỗ trợ sau bán hàng tận tâm.",
    cta: "Tìm hiểu thêm",
    href: "/gioi-thieu",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=65&auto=format&fit=crop",
  },
  {
    title: "Giảm 20% bộ Office bản quyền",
    description: "Kích hoạt trong 5 phút, hỗ trợ cài đặt từ xa.",
    cta: "Nhận ưu đãi",
    image:
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=1200&q=65&auto=format&fit=crop",
  },
  {
    title: "Bảo mật đa lớp cho doanh nghiệp",
    description: "Diệt virus, chống ransomware, quản trị tập trung.",
    cta: "Xem gói bảo mật",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=65&auto=format&fit=crop",
  },
  {
    title: "Hỗ trợ 24/7 - Uy tín, tận tâm",
    description: "Đội ngũ kỹ thuật sẵn sàng hỗ trợ mọi thời điểm.",
    cta: "Liên hệ ngay",
    image:
      "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?w=1200&q=65&auto=format&fit=crop",
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const active = slides[current];

  return (
    <section
      className="group/banner relative flex h-[260px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md sm:h-[300px] md:h-[320px] dark:border-slate-800 dark:bg-slate-900 dark:shadow-lg dark:shadow-slate-700/30"
      aria-label="Banner quảng cáo"
      role="region"
    >
      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-blue-600 opacity-0 group-hover/banner:opacity-100 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-700 dark:hover:text-blue-400 sm:left-4"
        aria-label="Slide trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-blue-600 opacity-0 group-hover/banner:opacity-100 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-700 dark:hover:text-blue-400 sm:right-4"
        aria-label="Slide tiếp theo"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-3 p-3 text-center md:grid-cols-2 md:gap-6 md:p-5 md:text-left">
        <div className="flex min-h-0 flex-col justify-center space-y-1.5 md:space-y-2.5">
          <div className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-100 md:px-2.5 md:py-1 md:text-xs md:mx-0 mx-auto">
            {current === 0 ? "Giới thiệu" : "Ưu đãi đặc biệt"}
          </div>
          <h2 className="text-base font-bold leading-snug text-gray-900 dark:text-white sm:text-lg md:text-xl line-clamp-2">
            {active.title}
          </h2>
          <p className="mx-auto line-clamp-2 max-w-xl text-xs text-gray-600 dark:text-slate-200 sm:text-sm md:mx-0">
            {active.description}
          </p>
          <button
            className="mx-auto mt-1 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white shadow transition hover:bg-blue-700 md:mx-0 md:mt-2 md:px-3.5 md:py-1.5 md:text-xs"
            aria-label={`${active.cta} - ${active.title}`}
            onClick={() => {
              if (typeof window !== "undefined" && (active as any).href) {
                const href = (active as any).href as string;
                window.history.pushState({}, "", href);
                window.dispatchEvent(new PopStateEvent("popstate"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            {active.cta}
          </button>
        </div>
        <div className="relative h-32 shrink-0 sm:h-40 md:h-44">
          <div
            className="absolute inset-0 rounded-xl bg-cover bg-center bg-no-repeat shadow-inner"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0)), url(${active.image})`,
            }}
            role="img"
            aria-label={`Hình ảnh minh họa: ${active.title} - ${active.description}`}
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-slate-950/60 via-slate-900/30 to-transparent opacity-0 transition-opacity duration-300 dark:opacity-100" />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 pb-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 cursor-pointer rounded-full transition-all ${
              i === current
                ? "w-6 bg-blue-600 dark:bg-blue-400"
                : "w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-500"
            }`}
            aria-label={`Chuyển slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
