import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { ServicesSidebar } from "./ServicesSidebar";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, productsQueryKey } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  activateRenewAdobeWebsiteProfile,
  fetchRenewAdobeWebsiteStatus,
} from "./renewAdobe.api";
import type {
  RenewAdobeWebsiteStatusCode,
  RenewAdobeWebsiteStatusResponse,
} from "./renewAdobe.types";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  PackageX,
  ExternalLink,
} from "lucide-react";

function AnimatedCheckmark() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <div className="anim-check-ring absolute inset-0 rounded-full border-2 border-emerald-400" />
      <div className="anim-check-wrap flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <polyline
            className="anim-check-svg-path"
            points="7,18 14,25 27,11"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default function RenewAdobePage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resultType, setResultType] = useState<
    | "check-success"
    | "expired"
    | "outside-order"
    | "activate-success"
    | "error"
    | "info"
    | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [canActivate, setCanActivate] = useState(false);
  /** no_order | order_expired — chỉ dùng khi resultType === outside-order */
  const [outsideOrderStatus, setOutsideOrderStatus] =
    useState<Extract<RenewAdobeWebsiteStatusCode, "no_order" | "order_expired"> | null>(
      null,
    );
  /** active nhưng chưa có product trên Adobe — hiện CTA mở url_access */
  const [successNeedsProductLink, setSuccessNeedsProductLink] = useState(false);
  const [urlAccess, setUrlAccess] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
    queryFn: fetchProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const handleLogoClick = () => {
    window.history.pushState({}, "", ROUTES.home);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const resetResult = (options?: { preserveProfileName?: boolean }) => {
    setResultType(null);
    setMessage(null);
    setCanActivate(false);
    setOutsideOrderStatus(null);
    setSuccessNeedsProductLink(false);
    setUrlAccess(null);
    if (!options?.preserveProfileName) {
      setProfileName(null);
    }
  };

  const applyStatusResult = (data: RenewAdobeWebsiteStatusResponse) => {
    setProfileName(data.profileName);
    setCanActivate(data.canActivate);

    if (data.status === "active") {
      setResultType("check-success");
      setOutsideOrderStatus(null);
      setMessage(data.message);
      const acc = data.account;
      const pending = Boolean(acc && acc.userHasProduct !== true);
      setSuccessNeedsProductLink(pending);
      const rawUrl = acc?.urlAccess != null ? String(acc.urlAccess).trim() : "";
      setUrlAccess(rawUrl || null);
      return;
    }

    if (data.status === "no_order" || data.status === "order_expired") {
      setResultType("outside-order");
      setOutsideOrderStatus(data.status);
      setSuccessNeedsProductLink(false);
      setUrlAccess(null);
      setMessage(null);
      return;
    }

    setOutsideOrderStatus(null);
    setSuccessNeedsProductLink(false);
    setUrlAccess(null);
    setResultType("expired");
    setMessage(data.message);
  };

  /* ── Kiểm tra Profile từ public renew-adobe status API ── */
  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Vui lòng nhập email để kiểm tra.");
      setResultType("info");
      return;
    }

    setLoading(true);
    resetResult();

    try {
      const data = await fetchRenewAdobeWebsiteStatus(email.trim());
      applyStatusResult(data);
    } catch (err) {
      console.error("Lookup error:", err);
      setResultType("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Có lỗi kết nối tới máy chủ. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Kích hoạt Profile (POST /api/renew-adobe/public/activate) ── */
  const handleActivate = async () => {
    if (!email.trim() || activating) return;

    setActivating(true);
    resetResult({ preserveProfileName: true });

    try {
      const data = await activateRenewAdobeWebsiteProfile(email.trim());
      setProfileName(data.profileName);
      setCanActivate(false);
      setResultType("activate-success");
      setMessage(
        data.message || `Profile đã được kích hoạt thành công cho ${email.trim()}.`,
      );
    } catch (err) {
      console.error("Fix-user error:", err);
      setResultType("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Có lỗi kết nối tới dịch vụ kích hoạt. Vui lòng thử lại sau.",
      );
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/20 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={handleLogoClick}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={products.map((p) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories.map((c) => ({
            id: String(c.id),
            name: c.name,
            slug: c.name.toLowerCase().replace(/\s+/g, "-"),
          }))}
          onProductClick={(slug) => {
            window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          onCategoryClick={(slug) => {
            window.history.pushState({}, "", ROUTES.category(slug));
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          user={user}
          onLogout={logout}
        />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl gap-6 px-4 py-10">
        <ServicesSidebar />
        <div className="flex flex-1 min-w-0 items-center justify-center">
          <div className="w-full max-w-xl">
            <div className="mb-5 px-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">Renew Adobe</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Kiểm tra và kích hoạt lại Adobe profile
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-purple-900/30">
              <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-purple-600/15 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent" />

              <div className="relative p-8 sm:p-10">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Search
                      className="h-5 w-5 shrink-0 text-purple-400 renew-adobe-search-titles"
                      strokeWidth={2}
                    />
                    <h2 className="text-xl font-bold text-slate-50">Kiểm tra & Kích hoạt</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Kiểm tra trạng thái Adobe profile của bạn
                  </p>
                </div>

                <form onSubmit={handleCheckSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Email Adobe
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@mkvest.com"
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-transparent transition-all focus:border-purple-500 focus:ring-purple-500/40"
                    />
                  </div>

                  {activating && (
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/60 px-5 py-5 text-center">
                      <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-sky-400" />
                      <p className="text-base font-semibold text-sky-200">Đang chuyển profile...</p>
                      <div className="mt-3 space-y-1 text-xs text-slate-400">
                        <p>Email: <span className="font-medium text-slate-200">{email.trim()}</span></p>
                        {profileName && (
                          <p>Profile: <span className="font-medium text-slate-200">{profileName}</span></p>
                        )}
                      </div>
                      <p className="mt-3 text-xs italic text-slate-500">Đang mở trình duyệt và đăng nhập...</p>
                    </div>
                  )}

                  {!loading &&
                    !activating &&
                    resultType &&
                    (resultType === "outside-order" || message) && (
                    <div>
                      {resultType === "check-success" && (
                        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                          <div className="mb-3 flex flex-col items-center gap-3">
                            <AnimatedCheckmark />
                            <span className="text-base font-bold text-emerald-300">
                              {successNeedsProductLink
                                ? "Kích hoạt thành công — hoàn tất nhận gói"
                                : "Profile đang hoạt động bình thường!"}
                            </span>
                          </div>
                          {profileName && (
                            <p className="text-lg font-bold text-emerald-200 tracking-wide">{profileName}</p>
                          )}
                          {successNeedsProductLink && message && (
                            <p className="mt-3 max-w-md text-xs leading-relaxed text-emerald-100/85">
                              {message}
                            </p>
                          )}
                          {successNeedsProductLink && urlAccess && (
                            <a
                              href={urlAccess}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/35 transition hover:bg-sky-600"
                            >
                              <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
                              Mở liên kết nhận gói Adobe
                            </a>
                          )}
                          {successNeedsProductLink && !urlAccess && (
                            <p className="mt-3 text-xs text-amber-200/90">
                              Chưa có liên kết trên hệ thống. Vui lòng liên hệ admin để nhận{" "}
                              <span className="font-medium">url_access</span>.
                            </p>
                          )}
                        </div>
                      )}

                      {resultType === "outside-order" && (
                        <div
                          className="relative overflow-hidden rounded-2xl border border-rose-500/45 bg-rose-500/10 px-4 py-5 text-center text-sm text-rose-50 shadow-lg shadow-rose-500/25 ring-1 ring-rose-400/20"
                          role="alert"
                        >
                          <div
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(244,63,94,0.14),transparent_55%)]"
                            aria-hidden
                          />
                          <div className="relative flex flex-col items-center gap-3">
                            <div className="renew-adobe-status-glow-rose flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/30 ring-1 ring-rose-400/50 shadow-[0_0_24px_-4px_rgba(244,63,94,0.5)]">
                              <span className="renew-adobe-status-icon-bounce inline-flex">
                                <PackageX className="h-7 w-7 text-rose-200" strokeWidth={2} />
                              </span>
                            </div>
                            <p className="text-base font-bold text-rose-100">
                              Không có gói
                            </p>
                            <p className="text-sm font-semibold text-rose-300">
                              {outsideOrderStatus === "order_expired"
                                ? "Đơn hàng hết hạn"
                                : "Không có đơn Renew Adobe còn hiệu lực"}
                            </p>
                            <p className="max-w-md border-t border-rose-500/30 pt-3 text-xs leading-relaxed text-rose-100/90">
                              Vui lòng liên hệ admin để có thể kích hoạt lại gói
                            </p>
                          </div>
                        </div>
                      )}

                      {resultType === "expired" && (
                        <div
                          className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-5 text-center text-sm text-amber-50 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/15"
                          role="alert"
                        >
                          <div
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.12),transparent_55%)]"
                            aria-hidden
                          />
                          <div className="relative flex flex-col items-center gap-3">
                            <div className="renew-adobe-status-glow-amber flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/25 ring-1 ring-amber-400/50 shadow-[0_0_24px_-4px_rgba(251,191,36,0.45)]">
                              <span className="renew-adobe-status-icon-bounce inline-flex">
                                <AlertTriangle className="h-7 w-7 text-amber-300" strokeWidth={2} />
                              </span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                              Cần kích hoạt lại
                            </p>
                            <span className="text-base font-bold text-amber-200">
                              Profile hết hạn
                            </span>
                            {profileName && (
                              <p className="text-lg font-bold tracking-wide text-amber-100">
                                {profileName}
                              </p>
                            )}
                            <p className="max-w-md border-t border-amber-500/25 pt-3 text-xs leading-relaxed text-amber-100/90">
                              {message}
                            </p>
                          </div>
                        </div>
                      )}

                      {resultType === "activate-success" && (
                        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                          <div className="mb-3 flex flex-col items-center gap-3">
                            <AnimatedCheckmark />
                            <span className="text-base font-bold text-emerald-300">Chuyển profile thành công!</span>
                          </div>
                          {profileName && (
                            <p className="text-lg font-bold text-emerald-200 tracking-wide">{profileName}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              window.history.pushState({}, "", ROUTES.adobeGuide);
                              window.dispatchEvent(new PopStateEvent("popstate"));
                            }}
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-500/40 hover:bg-sky-600"
                          >
                            Hướng dẫn đăng nhập lại Team
                          </button>
                        </div>
                      )}

                      {resultType === "error" && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-50">
                          <XCircle className="renew-adobe-error-icon mb-2 h-8 w-8 text-rose-400" strokeWidth={2} />
                          <p className="text-sm font-medium text-rose-100">{message}</p>
                        </div>
                      )}

                      {resultType === "info" && (
                        <div className="rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700">
                          {message}
                        </div>
                      )}
                    </div>
                  )}

                  {resultType === "expired" && canActivate ? (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={activating}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60"
                    >
                      {activating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Đang kích hoạt...</>
                      ) : (
                        <><RefreshCw className="h-4 w-4 renew-adobe-refresh-nudge" strokeWidth={2} />Kích hoạt lại ngay</>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || activating}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 disabled:opacity-60"
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Đang kiểm tra...</>
                      ) : activating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Đang kích hoạt...</>
                      ) : (
                        <><Search className="h-4 w-4 renew-adobe-search-btn" strokeWidth={2} />Kiểm tra Profile</>
                      )}
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-600">
              <span>© 2026 Renew Adobe Tool by Mavryk Premium Store</span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Bảo mật bởi Mavryk Premium Store
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes anim-check-circle {
          0%        { transform: scale(0);    opacity: 0; }
          18%       { transform: scale(1.18); opacity: 1; }
          28%       { transform: scale(1);    opacity: 1; }
          72%       { transform: scale(1);    opacity: 1; }
          88%, 100% { transform: scale(0.7);  opacity: 0; }
        }
        @keyframes anim-check-path {
          0%,  22%  { stroke-dashoffset: 52; opacity: 0; }
          26%        { opacity: 1; }
          55%        { stroke-dashoffset: 0;  opacity: 1; }
          72%        { stroke-dashoffset: 0;  opacity: 1; }
          88%, 100%  { stroke-dashoffset: 52; opacity: 0; }
        }
        @keyframes anim-check-ring {
          0%        { transform: scale(0.6); opacity: 0; }
          18%       { transform: scale(1.35); opacity: 0.5; }
          35%       { transform: scale(1.6);  opacity: 0; }
          100%      { transform: scale(1.6);  opacity: 0; }
        }
        .anim-check-wrap {
          animation: anim-check-circle 2.8s cubic-bezier(0.34, 1.4, 0.64, 1) infinite;
        }
        .anim-check-svg-path {
          stroke-dasharray: 52;
          animation: anim-check-path 2.8s ease-in-out infinite;
        }
        .anim-check-ring {
          animation: anim-check-ring 2.8s ease-out infinite;
        }

        @keyframes renew-adobe-search-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.92; }
        }
        .renew-adobe-search-titles {
          animation: renew-adobe-search-breathe 3.2s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes renew-adobe-search-btn-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .renew-adobe-search-btn {
          animation: renew-adobe-search-btn-pulse 2.4s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes renew-adobe-refresh-nudge {
          0%, 100% { transform: rotate(0deg) scale(1); }
          40% { transform: rotate(-14deg) scale(1.04); }
          70% { transform: rotate(10deg) scale(1.04); }
        }
        .renew-adobe-refresh-nudge {
          animation: renew-adobe-refresh-nudge 3.2s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes renew-adobe-status-icon-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          35% { transform: translateY(-6px) rotate(-4deg); }
          70% { transform: translateY(-2px) rotate(4deg); }
        }
        .renew-adobe-status-icon-bounce {
          animation: renew-adobe-status-icon-bounce 2.6s ease-in-out infinite;
        }

        @keyframes renew-adobe-glow-pulse-rose {
          0%, 100% {
            box-shadow: 0 0 22px -4px rgba(244, 63, 94, 0.48), 0 0 0 0 rgba(244, 63, 94, 0);
          }
          50% {
            box-shadow: 0 0 34px -2px rgba(244, 63, 94, 0.62), 0 0 20px -8px rgba(244, 63, 94, 0.35);
          }
        }
        .renew-adobe-status-glow-rose {
          animation: renew-adobe-glow-pulse-rose 2.2s ease-in-out infinite;
        }

        @keyframes renew-adobe-glow-pulse-amber {
          0%, 100% {
            box-shadow: 0 0 22px -4px rgba(251, 191, 36, 0.42), 0 0 0 0 rgba(251, 191, 36, 0);
          }
          50% {
            box-shadow: 0 0 34px -2px rgba(251, 191, 36, 0.58), 0 0 20px -8px rgba(251, 191, 36, 0.3);
          }
        }
        .renew-adobe-status-glow-amber {
          animation: renew-adobe-glow-pulse-amber 2.2s ease-in-out infinite;
        }

        @keyframes renew-adobe-error-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.88; }
        }
        .renew-adobe-error-icon {
          animation: renew-adobe-error-ring 2s ease-in-out infinite;
          transform-origin: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .renew-adobe-search-titles,
          .renew-adobe-search-btn,
          .renew-adobe-refresh-nudge,
          .renew-adobe-status-icon-bounce,
          .renew-adobe-status-glow-rose,
          .renew-adobe-status-glow-amber,
          .renew-adobe-error-icon {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
