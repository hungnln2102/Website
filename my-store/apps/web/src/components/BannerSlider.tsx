"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const BANNER_IMAGE_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) min(92vw, 960px), 1200px";

const buildUnsplashUrl = (photoId: string, width: number) =>
  `https://images.unsplash.com/${photoId}?w=${width}&q=58&fit=crop&crop=entropy&fm=webp`;

const buildResponsiveImage = (photoId: string) => {
  const widths = [640, 960, 1280];
  return {
    src: buildUnsplashUrl(photoId, 960),
    srcSet: widths.map((width) => `${buildUnsplashUrl(photoId, width)} ${width}w`).join(", "),
  };
};

const slides = [
  {
    title: "Mavryk Premium Store - Cửa hàng phần mềm bản quyền chính hãng",
    description:
      "Mavryk Premium Store cung cấp key và tài khoản bản quyền cho Windows, Office, Adobe, Autodesk cùng nhiều phần mềm làm việc khác. Sản phẩm rõ nguồn gốc, hướng dẫn kích hoạt chi tiết, xử lý đơn nhanh và hỗ trợ sau bán hàng tận tâm.",
    cta: "Tìm hiểu thêm",
    href: ROUTES.about,
    image: buildResponsiveImage("photo-1519389950473-47ba0277781c"),
  },
  {
    title: "Giảm 20% bộ Office bản quyền",
    description: "Kích hoạt trong 5 phút, hỗ trợ cài đặt từ xa.",
    cta: "Nhận ưu đãi",
    image: buildResponsiveImage("photo-1526498460520-4c246339dccb"),
  },
  {
    title: "Bảo mật đa lớp cho doanh nghiệp",
    description: "Diệt virus, chống ransomware, quản trị tập trung.",
    cta: "Xem gói bảo mật",
    image: buildResponsiveImage("photo-1515879218367-8466d910aaa4"),
  },
  {
    title: "Hỗ trợ 24/7 - Uy tín, tận tâm",
    description: "Đội ngũ kỹ thuật sẵn sàng hỗ trợ mọi thời điểm.",
    cta: "Liên hệ ngay",
    image: buildResponsiveImage("photo-1483478550801-ceba5fe50e8e"),
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const active = slides[current];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const preloadNextImage = () => {
      const nextSlide = slides[(current + 1) % slides.length];
      const image = new Image();
      image.src = nextSlide.image.src;
      image.srcset = nextSlide.image.srcSet;
      image.sizes = BANNER_IMAGE_SIZES;
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const idleId = idleWindow.requestIdleCallback(preloadNextImage, { timeout: 1800 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(preloadNextImage, 700);
    return () => window.clearTimeout(timeoutId);
  }, [current]);

  const heroBadge = useMemo(
    () => (current === 0 ? "Giới thiệu" : "Ưu đãi đặc biệt"),
    [current]
  );

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <section
      className="group/banner relative flex h-[240px] w-full flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-xl sm:h-[280px] md:h-[320px]"
      aria-label="Banner quảng cáo"
      role="region"
    >
      <div className="absolute inset-0 z-0">
        <div key={current} className="absolute inset-0 animate-in fade-in duration-700">
          <img
            src={active.image.src}
            srcSet={active.image.srcSet}
            sizes={BANNER_IMAGE_SIZES}
            alt={active.title}
            className="h-full w-full object-cover"
            width={1200}
            height={675}
            loading={current === 0 ? "eager" : "lazy"}
            decoding={current === 0 ? "sync" : "async"}
            fetchPriority={current === 0 ? "high" : "auto"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-transparent to-transparent" />
        </div>
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 group-hover/banner:opacity-100 sm:left-6 md:h-12 md:w-12"
        aria-label="Slide trước"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 group-hover/banner:opacity-100 sm:right-6 md:h-12 md:w-12"
        aria-label="Slide tiếp theo"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="relative z-10 flex h-full flex-col justify-center p-5 pt-8 sm:p-8 md:p-10 lg:p-12">
        <div className="max-w-2xl translate-y-0 transform opacity-100 transition-all duration-700">
          <div className="mb-2 inline-flex items-center rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md sm:mb-3 sm:text-xs">
            {heroBadge}
          </div>
          <h2 className="mb-2 text-2xl font-black leading-tight text-white drop-shadow-md sm:text-3xl md:text-3xl lg:text-4xl">
            {active.title}
          </h2>
          <p className="mb-4 max-w-xl line-clamp-2 text-xs leading-relaxed text-slate-200 drop-shadow sm:mb-5 sm:line-clamp-3 sm:text-sm md:text-base">
            {active.description}
          </p>
          <button
            className="group relative flex w-fit cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(37,99,235,1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,1)] sm:px-6 sm:py-3 sm:text-base md:px-8 md:py-3.5"
            aria-label={`${active.cta} - ${active.title}`}
            onClick={() => {
              if (typeof window !== "undefined" && active.href) {
                window.history.pushState({}, "", active.href);
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

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={`Chuyển slide ${index + 1}`}
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                index === current
                  ? "h-2 w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] sm:w-10"
                  : "h-2 w-2 bg-white/50 group-hover/banner:bg-white/70"
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
