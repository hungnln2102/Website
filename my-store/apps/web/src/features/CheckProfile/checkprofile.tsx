import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { ServicesSidebar } from "./ServicesSidebar";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, productsQueryKey } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { ShieldCheck } from "lucide-react";
import { useCheckProfile } from "./hooks/useCheckProfile";
import { SlideOverlay } from "./components/SlideOverlay";
import { CheckActivatePanel } from "./components/CheckActivatePanel";
import { OtpPanel } from "./components/OtpPanel";

export default function CheckProfilePage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const cp = useCheckProfile();

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
          <div className="w-full max-w-4xl">
            {/* Title */}
            <div className="mb-5 px-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">
                Fix lỗi Adobe
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Kiểm tra, kích hoạt và nhận OTP Adobe profile
              </p>
            </div>

            {/* Main Card */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-purple-900/30 min-h-[540px]">
              <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-purple-600/15 blur-3xl" />

              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[540px]">
                <CheckActivatePanel
                  isCheckMode={cp.isCheckMode}
                  email={cp.email}
                  onEmailChange={cp.setEmail}
                  loading={cp.loading}
                  activating={cp.activating}
                  resultType={cp.resultType}
                  message={cp.message}
                  profileName={cp.profileName}
                  onCheckSubmit={cp.handleCheckSubmit}
                  onActivate={cp.handleActivate}
                  onSwitchToOtp={() => cp.setIsCheckMode(false)}
                />

                <OtpPanel
                  isCheckMode={cp.isCheckMode}
                  email={cp.email}
                  onEmailChange={cp.setEmail}
                  otpSent={cp.otpSent}
                  otpCode={cp.otpCode}
                  sendingOtp={cp.sendingOtp}
                  otpMessage={cp.otpMessage}
                  otpResultType={cp.otpResultType}
                  onSendOtp={cp.handleSendOtp}
                  onResetOtp={cp.resetOtp}
                  onSwitchToCheck={() => cp.setIsCheckMode(true)}
                />
              </div>

              <SlideOverlay
                isCheckMode={cp.isCheckMode}
                onToggle={() => cp.setIsCheckMode(!cp.isCheckMode)}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-600">
              <span>© 2026 Trung tâm gói — Mavryk Premium Store</span>
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
        @keyframes cp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes cp-float-d {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-8px) rotate(45deg); }
        }
        .animate-cp-float  { animation: cp-float   3s ease-in-out infinite; }
        .animate-cp-float-d { animation: cp-float-d 3s ease-in-out infinite 0.5s; }

        @keyframes cp-slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cp-slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 1023px) {
          .cp-panel-left-active  { animation: cp-slide-in-left  0.4s ease-out forwards; }
          .cp-panel-right-active { animation: cp-slide-in-right 0.4s ease-out forwards; }
          .cp-panel-hidden       { display: none !important; }
        }

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
      `}</style>
    </div>
  );
}
