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
      className="group/banner relative flex h-[240px] w-full flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-xl sm:h-[280px] md:h-[320px]"
      aria-label="Banner quảng cáo"
      role="region"
    >
      {/* Background Image wrapper */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* Dark/Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 opacity-0 group-hover/banner:opacity-100 sm:left-6 md:h-12 md:w-12 shadow-2xl border border-white/20"
        aria-label="Slide trước"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 opacity-0 group-hover/banner:opacity-100 sm:right-6 md:h-12 md:w-12 shadow-2xl border border-white/20"
        aria-label="Slide tiếp theo"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Content wrapper */}
      <div className="relative z-10 flex h-full flex-col justify-center p-5 pt-8 sm:p-8 md:p-10 lg:p-12">
        <div className="max-w-2xl transform transition-all duration-700 translate-y-0 opacity-100">
          <div className="mb-2 inline-flex items-center rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md ring-1 ring-white/20 sm:mb-3">
            {current === 0 ? "Giới thiệu" : "Ưu đãi đặc biệt"}
          </div>
          <h2 className="mb-2 text-2xl font-black leading-tight text-white drop-shadow-md sm:text-3xl md:text-3xl lg:text-4xl">
            {active.title}
          </h2>
          <p className="mb-4 sm:mb-5 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-200 drop-shadow md:text-base line-clamp-2 sm:line-clamp-3">
            {active.description}
          </p>
          <button
            className="group relative flex w-fit cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-bold text-white shadow-[0_0_40px_-10px_rgba(37,99,235,1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,1)] md:px-8 md:py-3.5"
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
            <span className="relative z-10">{active.cta}</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 sm:h-2 cursor-pointer rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] sm:w-10"
                : "w-2 bg-white/40 hover:bg-white/70 sm:w-2"
            }`}
            aria-label={`Chuyển slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
