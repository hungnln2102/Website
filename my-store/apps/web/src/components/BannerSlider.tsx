"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Giảm 20% bộ Office bản quyền",
    description: "Kích hoạt trong 5 phút, hỗ trợ cài đặt từ xa.",
    cta: "Nhận ưu đãi",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=65&auto=format&fit=crop",
  },
  {
    title: "Bảo mật đa lớp cho doanh nghiệp",
    description: "Diệt virus, chống ransomware, quản trị tập trung.",
    cta: "Xem gói bảo mật",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=65&auto=format&fit=crop",
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
      className="group/banner relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-lg dark:shadow-slate-700/30"
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

      <div className="grid items-center gap-3 p-3 md:grid-cols-2 md:gap-4 md:p-4 text-center md:text-left">
        <div className="space-y-1.5 md:space-y-2">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-100 md:px-2.5 md:py-1 md:text-xs">
            Ưu đãi đặc biệt
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl md:text-xl">{active.title}</h2>
          <p className="hidden text-xs text-gray-600 dark:text-slate-200 md:block">{active.description}</p>
          <button 
            className="mx-auto mt-0.5 cursor-pointer inline-flex w-fit items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white shadow transition hover:bg-blue-700 md:mx-0 md:mt-1.5 md:px-3.5 md:py-1.5 md:text-xs"
            aria-label={`${active.cta} - ${active.title}`}
          >
            {active.cta}
          </button>
        </div>
        <div className="relative h-32 sm:h-40 md:h-44">
          <div
            className="absolute inset-0 rounded-xl bg-cover bg-center shadow-inner"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0)), url(${active.image})`,
            }}
            role="img"
            aria-label={`Hình ảnh minh họa: ${active.title} - ${active.description}`}
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-slate-950/60 via-slate-900/30 to-transparent opacity-0 transition-opacity duration-300 dark:opacity-100" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-4">
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
