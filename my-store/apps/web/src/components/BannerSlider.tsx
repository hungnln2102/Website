"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BRANDING_ASSETS } from "@/lib/brandingAssets";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import {
  fetchActiveHomeBanners,
  type BannerSlide,
} from "@/lib/api/publicBanners.api";

const BANNER_IMAGE_SIZES =
  "(max-width: 1024px) min(92vw, 960px), 1200px";

const buildUnsplashUrl = (photoId: string, width: number) =>
  `https://images.unsplash.com/${photoId}?w=${width}&q=45&fit=crop&crop=entropy&fm=webp`;

const buildResponsiveImage = (photoId: string) => {
  const widths = [768, 960, 1280];
  return {
    src: buildUnsplashUrl(photoId, 960),
    srcSet: widths.map((width) => `${buildUnsplashUrl(photoId, width)} ${width}w`).join(", "),
  };
};

/** Khi API lỗi hoặc không có dòng active — giữ hành vi cũ. */
function buildFallbackSlides(): BannerSlide[] {
  const i1 = buildResponsiveImage("photo-1519389950473-47ba0277781c");
  const i2 = buildResponsiveImage("photo-1526498460520-4c246339dccb");
  const i3 = buildResponsiveImage("photo-1515879218367-8466d910aaa4");
  const i4 = buildResponsiveImage("photo-1483478550801-ceba5fe50e8e");
  return [
    {
      title: `${APP_CONFIG.name} - Phần mềm bản quyền chính hãng`,
      description:
        "Mavryk Premium Store cung cấp key và tài khoản bản quyền cho Windows, Office, Adobe, Autodesk cùng nhiều phần mềm làm việc khác. Sản phẩm rõ nguồn gốc, hướng dẫn kích hoạt chi tiết, xử lý đơn nhanh và hỗ trợ sau bán hàng tận tâm.",
      tagText: "Giới thiệu",
      cta: "Tìm hiểu thêm",
      href: ROUTES.about,
      imageSrc: i1.src,
      imageAlt: `${APP_CONFIG.name} — không gian làm việc`,
      imageSrcSet: i1.srcSet,
    },
    {
      title: "Giảm 20% bộ Office bản quyền",
      description: "Kích hoạt trong 5 phút, hỗ trợ cài đặt từ xa.",
      tagText: "Ưu đãi đặc biệt",
      cta: "Nhận ưu đãi",
      href: "/promotions",
      imageSrc: i2.src,
      imageAlt: "Ưu đãi Office",
      imageSrcSet: i2.srcSet,
    },
    {
      title: "Bảo mật đa lớp cho doanh nghiệp",
      description: "Diệt virus, chống ransomware, quản trị tập trung.",
      tagText: "Ưu đãi đặc biệt",
      cta: "Xem gói bảo mật",
      href: "/all-products",
      imageSrc: i3.src,
      imageAlt: "Bảo mật doanh nghiệp",
      imageSrcSet: i3.srcSet,
    },
    {
      title: "Hỗ trợ 24/7 - Uy tín, tận tâm",
      description: "Đội ngũ kỹ thuật sẵn sàng hỗ trợ mọi thời điểm.",
      tagText: "Ưu đãi đặc biệt",
      cta: "Liên hệ ngay",
      href: ROUTES.about,
      imageSrc: i4.src,
      imageAlt: "Hỗ trợ khách hàng",
      imageSrcSet: i4.srcSet,
    },
  ];
}

function navigateCta(href: string) {
  if (!href.trim()) return;
  if (/^https?:\/\//i.test(href)) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  const path = href.startsWith("/") ? href : `/${href}`;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

interface BannerSliderProps {
  /**
   * Dùng trong hero có sidebar (lg+): banner kéo full chiều cao hàng flex,
   * tránh khoảng trống dưới banner khi cột danh mục cao hơn.
   */
  fillRow?: boolean;
}

export default function BannerSlider({ fillRow = false }: BannerSliderProps) {
  const fallback = useMemo(() => buildFallbackSlides(), []);
  const [slides, setSlides] = useState<BannerSlide[]>(fallback);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchActiveHomeBanners();
        if (cancelled || !remote.length) return;
        setSlides(remote);
      } catch {
        /* giữ fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [current, setCurrent] = useState(0);
  const [showDesktopImages, setShowDesktopImages] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
  );

  const slideCount = slides.length;
  const safeIndex = slideCount ? Math.min(current, slideCount - 1) : 0;
  const active = slides[safeIndex] ?? slides[0];

  useEffect(() => {
    if (current !== safeIndex) setCurrent(safeIndex);
  }, [current, safeIndex]);

  useEffect(() => {
    if (slideCount <= 1) return;
    const interval = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [slideCount]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const updateImageMode = (event?: MediaQueryListEvent) => {
      setShowDesktopImages(event?.matches ?? mediaQuery.matches);
    };

    updateImageMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateImageMode);
      return () => mediaQuery.removeEventListener("change", updateImageMode);
    }

    mediaQuery.addListener(updateImageMode);
    return () => mediaQuery.removeListener(updateImageMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !showDesktopImages || slideCount === 0) {
      return;
    }

    const preloadNextImage = () => {
      const nextSlide = slides[(safeIndex + 1) % slideCount];
      const image = new Image();
      image.src = nextSlide.imageSrc;
      if (nextSlide.imageSrcSet) {
        image.srcset = nextSlide.imageSrcSet;
        image.sizes = BANNER_IMAGE_SIZES;
      }
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
  }, [safeIndex, showDesktopImages, slideCount, slides]);

  const handlePrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  const handleNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  if (!active) {
    return null;
  }

  const heightClass = fillRow
    ? "h-[240px] min-h-[240px] sm:h-[280px] sm:min-h-[280px] md:h-[320px] md:min-h-[320px] lg:h-full lg:min-h-[320px] lg:flex-1"
    : "h-[240px] sm:h-[280px] md:h-[320px]";

  return (
    <section
      className={`group/banner relative flex w-full flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-xl ${heightClass}`}
      aria-label="Banner quảng cáo"
      role="region"
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.25),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.28),transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(15,23,42,0.94),rgba(30,41,59,0.92))]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-900/54 to-slate-900/12" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-transparent to-transparent" />

        <div className="absolute inset-y-0 right-0 flex w-[52%] items-center justify-center sm:hidden">
          <img
            src={BRANDING_ASSETS.logoTransparent}
            alt=""
            aria-hidden="true"
            width={180}
            height={180}
            fetchPriority="high"
            decoding="async"
            className="h-36 w-36 rounded-[2rem] object-cover opacity-20 shadow-[0_30px_90px_rgba(15,23,42,0.45)]"
          />
        </div>

        {showDesktopImages && (
          <div key={safeIndex} className="absolute inset-0 hidden animate-in fade-in duration-500 sm:block">
            <img
              src={active.imageSrc}
              srcSet={active.imageSrcSet}
              sizes={active.imageSrcSet ? BANNER_IMAGE_SIZES : undefined}
              alt={active.imageAlt}
              className="h-full w-full object-cover"
              width={1200}
              height={675}
              loading={safeIndex === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={safeIndex === 0 ? "high" : "auto"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-transparent to-transparent" />
          </div>
        )}
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 group-hover/banner:opacity-100 sm:left-6 md:h-12 md:w-12"
        aria-label="Slide trước"
        type="button"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 shadow-2xl backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 group-hover/banner:opacity-100 sm:right-6 md:h-12 md:w-12"
        aria-label="Slide tiếp theo"
        type="button"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="relative z-10 flex h-full flex-col justify-center p-5 pt-8 sm:p-8 md:p-10 lg:p-12">
        <div className="max-w-2xl translate-y-0 transform opacity-100 transition-all duration-700">
          <div className="mb-2 inline-flex items-center rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md sm:mb-3 sm:text-xs">
            {active.tagText}
          </div>
          <h1
            id="home-main-heading"
            className="mb-2 min-h-[3.5rem] text-2xl font-black leading-tight text-white drop-shadow-md line-clamp-2 sm:min-h-[4.5rem] sm:text-3xl md:text-3xl lg:min-h-[5rem] lg:text-4xl"
          >
            {active.title}
          </h1>
          <p className="mb-4 min-h-[2.5rem] max-w-xl line-clamp-2 text-xs leading-relaxed text-slate-200 drop-shadow sm:mb-5 sm:min-h-[4.25rem] sm:line-clamp-3 sm:text-sm md:min-h-[4.75rem] md:text-base">
            {active.description}
          </p>
          {active.href && active.cta ? (
            <button
              type="button"
              className="group relative flex w-fit cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(37,99,235,1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,1)] sm:px-6 sm:py-3 sm:text-base md:px-8 md:py-3.5"
              aria-label={`${active.cta} - ${active.title}`}
              onClick={() => navigateCta(active.href!)}
            >
              <span className="relative z-10">{active.cta}</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrent(index)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={`Chuyển slide ${index + 1}`}
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                index === safeIndex
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
