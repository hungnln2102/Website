import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { ServicesSidebar } from "./ServicesSidebar";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, getApiBase } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
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
    "check-success" | "expired" | "activate-success" | "error" | "info" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
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

  const resetResult = () => {
    setResultType(null);
    setMessage(null);
    setProfileName(null);
  };

  /* ── Kiểm tra Profile: lookup + thời hạn sử dụng (user-orders) ── */
  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Vui lòng nhập email để kiểm tra.");
      setResultType("info");
      return;
    }
    setLoading(true);
    resetResult();
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const API_BASE = getApiBase();

      const [lookupRes, ordersRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/renew-adobe/accounts/lookup?email=${encodeURIComponent(email.trim())}`,
          { credentials: "include" },
        ),
        fetch(`${API_BASE}/api/renew-adobe/user-orders`, { credentials: "include" }),
      ]);

      const data = await lookupRes.json().catch(() => null);

      if (lookupRes.status === 404 || !data?.account) {
        setResultType("expired");
        setMessage("Không tìm thấy tài khoản Adobe cho email này. Bấm nút bên dưới để kích hoạt.");
        return;
      }

      if (!lookupRes.ok) {
        setResultType("error");
        setMessage(data?.error || "Không kiểm tra được profile. Vui lòng thử lại sau.");
        return;
      }

      const account = data.account as Record<string, unknown>;
      const orgName = (account.org_name as string) || null;
      const licenseStatus = String(account.license_status ?? "").toLowerCase();
      setProfileName(orgName);

      if (licenseStatus === "expired" || licenseStatus === "unknown") {
        setResultType("expired");
        setMessage("Gói Adobe đã hết hạn. Bấm nút bên dưới để được cấp lại profile mới.");
        return;
      }

      let expiryDateStr: string | null = null;
      let orderExpired = false;
      if (ordersRes.ok) {
        const orders = (await ordersRes.json().catch(() => [])) as Array<{
          information_order?: string;
          expiry_date?: string;
        }>;
        const myOrders = orders.filter(
          (o) => String(o.information_order ?? "").trim().toLowerCase() === trimmedEmail,
        );
        if (myOrders.length > 0) {
          const latest = myOrders.reduce((a, b) => {
            const da = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
            const db = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
            return db > da ? b : a;
          });
          expiryDateStr = latest.expiry_date || null;
          if (expiryDateStr) {
            const expiry = new Date(expiryDateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expiry.setHours(0, 0, 0, 0);
            orderExpired = expiry < today;
          }
        }
      }

      if (orderExpired && expiryDateStr) {
        const d = new Date(expiryDateStr);
        const dmy = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        setResultType("expired");
        setMessage(`Đã hết hạn sử dụng (Hạn: ${dmy}). Bấm nút bên dưới để kích hoạt lại.`);
        return;
      }

      setResultType("check-success");
      setMessage("Profile đang hoạt động bình thường.");
    } catch (err) {
      console.error("Lookup error:", err);
      setResultType("error");
      setMessage("Có lỗi kết nối tới máy chủ. Vui lòng thử lại sau.");
    } finally { setLoading(false); }
  };

  /* ── Kích hoạt Profile (POST /api/renew-adobe/fix-user) ── */
  const handleActivate = async () => {
    if (!email.trim() || activating) return;
    setActivating(true);
    resetResult();
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/renew-adobe/fix-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setResultType("error");
        setMessage(data?.error || data?.message || "Không kích hoạt được profile. Vui lòng thử lại sau.");
        return;
      }

      const name = (data.profile as string) || profileName;
      setProfileName(name);
      setResultType("activate-success");
      setMessage(data.message || `Profile đã được kích hoạt thành công cho ${email.trim()}.`);
    } catch (err) {
      console.error("Fix-user error:", err);
      setResultType("error");
      setMessage("Có lỗi kết nối tới dịch vụ kích hoạt. Vui lòng thử lại sau.");
    } finally { setActivating(false); }
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
                    <Search className="h-5 w-5 text-purple-400" />
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

                  {!loading && !activating && message && resultType && (
                    <div>
                      {resultType === "check-success" && (
                        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                          <div className="mb-3 flex flex-col items-center gap-3">
                            <AnimatedCheckmark />
                            <span className="text-base font-bold text-emerald-300">Profile đang hoạt động bình thường!</span>
                          </div>
                          {profileName && (
                            <p className="text-lg font-bold text-emerald-200 tracking-wide">{profileName}</p>
                          )}
                        </div>
                      )}

                      {resultType === "expired" && (
                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-50">
                          <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            <span className="font-semibold">Profile hết hạn</span>
                          </div>
                          {profileName && (
                            <p className="mb-1 text-xs font-medium text-amber-200">
                              Profile: <span className="font-bold">{profileName}</span>
                            </p>
                          )}
                          <p className="text-xs text-amber-100/90">{message}</p>
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
                          <XCircle className="mb-2 h-8 w-8 text-rose-400" />
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

                  {resultType === "expired" ? (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={activating}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60"
                    >
                      {activating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Đang kích hoạt...</>
                      ) : (
                        <><RefreshCw className="h-4 w-4" />Kích hoạt lại ngay</>
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
                        <><Search className="h-4 w-4" />Kiểm tra Profile</>
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
      `}</style>
    </div>
  );
}
