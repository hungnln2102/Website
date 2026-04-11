import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { ServicesSidebar } from "./ServicesSidebar";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, productsQueryKey } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useRenewAdobe } from "./hooks/useRenewAdobe";
import { RenewStatusDisplay } from "./components/RenewStatusDisplay";
import { RENEW_ADOBE_STYLES } from "./renewAdobe.styles";

export default function RenewAdobePage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    email,
    setEmail,
    loading,
    activating,
    resultType,
    message,
    profileName,
    canActivate,
    outsideOrderStatus,
    successNeedsProductLink,
    urlAccess,
    handleCheckSubmit,
    handleActivate,
  } = useRenewAdobe();

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

                  <RenewStatusDisplay
                    loading={loading}
                    activating={activating}
                    resultType={resultType}
                    message={message}
                    profileName={profileName}
                    email={email}
                    outsideOrderStatus={outsideOrderStatus}
                    successNeedsProductLink={successNeedsProductLink}
                    urlAccess={urlAccess}
                  />

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

      <style>{RENEW_ADOBE_STYLES}</style>
    </div>
  );
}
