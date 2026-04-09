import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { ServicesSidebar } from "./ServicesSidebar";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, getApiBase, productsQueryKey } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  ShieldCheck,
  Loader2,
  Search,
  KeyRound,
  Copy,
  CheckCircle2,
  SendHorizonal,
  Sparkles,
  Shield,
  Zap,
  Tv,
  XCircle,
} from "lucide-react";

/* ─── Animated Checkmark ─────────────────────────────────────────────────── */
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

/* ─── Sliding Overlay ────────────────────────────────────────────────────── */
function SlideOverlay({
  isCheckMode,
  onToggle,
}: {
  isCheckMode: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 flex-col items-center justify-center bg-gradient-to-br from-red-700 via-rose-700 to-pink-800 p-12 z-20"
      style={{
        transform: isCheckMode ? "translateX(0%)" : "translateX(-100%)",
        transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
      }}
    >
      {/* Floating decorations */}
      <div className="absolute top-8 left-8 h-4 w-4 rounded-full bg-white/20 animate-nf-float" />
      <div className="absolute top-16 right-12 h-3 w-3 rotate-45 bg-white/15 animate-nf-float-d" />
      <div className="absolute bottom-20 left-16 h-3 w-3 rotate-45 bg-white/15 animate-nf-float" />
      <div className="absolute bottom-12 right-8 h-4 w-4 rounded-full bg-white/10 animate-nf-float-d" />
      <div className="absolute top-1/3 left-8 text-white/20">
        <Sparkles className="h-6 w-6 animate-pulse" />
      </div>
      <div className="absolute bottom-1/3 right-8 text-white/20">
        <Shield className="h-6 w-6 animate-pulse" />
      </div>
      <div className="absolute top-1/2 left-12 text-white/15">
        <Zap className="h-5 w-5 animate-pulse" />
      </div>

      {/* Icon */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm shadow-2xl ring-1 ring-white/20">
        {isCheckMode ? (
          <KeyRound className="h-11 w-11 text-white" />
        ) : (
          <Tv className="h-11 w-11 text-white" />
        )}
      </div>

      {/* Text */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-white">
          {isCheckMode ? "Nhận mã OTP" : "Hộ gia đình"}
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
          {isCheckMode
            ? "Nhận mã OTP để xác thực tài khoản Netflix của bạn một cách nhanh chóng và bảo mật."
            : "Kiểm tra trạng thái tài khoản Netflix và thông tin đăng nhập."}
        </p>
        <button
          onClick={onToggle}
          className="mt-6 rounded-full border-2 border-white/50 bg-transparent px-8 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-rose-700"
        >
          {isCheckMode ? "Nhận OTP →" : "← Kiểm tra"}
        </button>
      </div>
    </div>
  );
}

function EmailField({
  accent,
  cooldown,
  email,
  onChange,
}: {
  accent: "rose" | "sky";
  cooldown: number;
  email: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Email Netflix
      </label>
      <div className="relative">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          disabled={cooldown > 0}
          placeholder={
            cooldown > 0
              ? `Chờ ${cooldown}s để nhập email`
              : "your-email@example.com"
          }
          className={`h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-transparent transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
            accent === "rose"
              ? "focus:border-rose-500 focus:ring-rose-500/40"
              : "focus:border-sky-500 focus:ring-sky-500/40"
          }`}
        />
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function NetflixPage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  /* mode: true = Check active, false = OTP active */
  const [isCheckMode, setIsCheckMode] = useState(true);

  /* shared email */
  const [email, setEmail] = useState("");

  /* ── Check state ── */
  const [loading, setLoading] = useState(false);
  const [resultType, setResultType] = useState<
    "check-success" | "error" | "info" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [householdLink, setHouseholdLink] = useState<string | null>(null);

  /* ── Countdown state ── */
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /* ── OTP state ── */
  useEffect(() => {
    startCooldown(30);
  }, [startCooldown]);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpResultType, setOtpResultType] = useState<
    "success" | "error" | "info" | null
  >(null);

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

  const resetResult = () => {
    setResultType(null);
    setMessage(null);
    setHouseholdLink(null);
  };

  /* ── Hộ gia đình: gọi proxy → vivarocky.in/household.php ── */
  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Vui lòng nhập email để kiểm tra.");
      setResultType("info");
      return;
    }
    if (cooldown > 0) return;

    setLoading(true);
    resetResult();

    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/netflix/household`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      console.log("[netflix] API response:", data);

      if (data.cooldown) startCooldown(data.cooldown);

      if (data.ok) {
        setResultType("check-success");
        setMessage(data.message || "Thành công!");
        setHouseholdLink(data.link || null);
      } else {
        setResultType("error");
        setMessage(data.message || data.error || "Không tìm thấy email gần đây từ địa chỉ này.");
      }
    } catch {
      setResultType("error");
      setMessage("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Lấy OTP Netflix ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sendingOtp) return;

    setSendingOtp(true);
    setOtpMessage(null);
    setOtpResultType(null);
    setOtpSent(false);

    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/netflix/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setOtpCode("");
        setOtpResultType("error");
        setOtpMessage(data?.message || data?.error || "Không lấy được mã OTP. Vui lòng thử lại.");
        return;
      }

      const nextCode = String(data?.code || "").trim();
      setOtpSent(true);
      setOtpCode(nextCode);
      setOtpResultType("success");
      setOtpMessage(data?.message || `Đã lấy mã OTP mới nhất cho ${email.trim()}.`);
    } catch (err) {
      console.error("Send Netflix OTP error:", err);
      setOtpCode("");
      setOtpResultType("error");
      setOtpMessage("Có lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setSendingOtp(false);
    }
  };

  /* ── Sao chép OTP ── */
  const handleCopyOtp = async () => {
    if (!email.trim() || !otpCode.trim() || verifyingOtp) return;

    setVerifyingOtp(true);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(otpCode.trim());
        setOtpResultType("success");
        setOtpMessage(`Đã sao chép mã OTP ${otpCode.trim()}.`);
      } else {
        setOtpResultType("info");
        setOtpMessage(`Mã OTP hiện tại: ${otpCode.trim()}`);
      }
    } catch (err) {
      console.error("Copy Netflix OTP error:", err);
      setOtpResultType("info");
      setOtpMessage(`Mã OTP hiện tại: ${otpCode.trim()}`);
    } finally {
      setVerifyingOtp(false);
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
          <div className="w-full max-w-4xl">
            {/* Title */}
            <div className="mb-5 px-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">OTP Netflix</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Hộ gia đình và nhận OTP Netflix
              </p>
            </div>

            {/* ── Main Card ── */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-rose-900/30 min-h-[540px]">
              {/* Glow */}
              <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-rose-600/15 blur-3xl" />

              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[540px]">

                {/* ── Left Panel: Kiểm tra tài khoản ── */}
                <div
                  className={`relative p-8 sm:p-10 transition-opacity duration-500 ${
                    isCheckMode
                      ? "opacity-100 nf-panel-left-active"
                      : "lg:opacity-0 lg:pointer-events-none nf-panel-hidden"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-red-500/5 to-transparent" />
                  <div className="relative flex h-full flex-col justify-center">
                    <div className="mb-6">
                      <div className="flex items-center gap-2">
                        <Tv className="h-5 w-5 text-rose-400" />
                        <h2 className="text-xl font-bold text-slate-50">Hộ gia đình</h2>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        Xác minh hộ gia đình Netflix của bạn
                      </p>
                    </div>

                    <form onSubmit={handleCheckSubmit} className="space-y-4">
                      <EmailField
                        accent="rose"
                        cooldown={cooldown}
                        email={email}
                        onChange={setEmail}
                      />

                      {/* Kết quả */}
                      {!loading && message && resultType && (
                        <div>
                          {resultType === "check-success" && (
                            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                              <div className="mb-3 flex flex-col items-center gap-3">
                                <AnimatedCheckmark />
                                <span className="text-base font-bold text-emerald-300">{message}</span>
                              </div>
                              {householdLink && (
                                <a
                                  href={householdLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                                >
                                  Mở liên kết hộ gia đình →
                                </a>
                              )}
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

                      <button
                        type="submit"
                        disabled={loading || cooldown > 0}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/50 disabled:opacity-60"
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Đang xử lý...</>
                        ) : cooldown > 0 ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Chờ {cooldown}s</>
                        ) : (
                          <><Search className="h-4 w-4" />Hộ gia đình</>
                        )}
                      </button>
                    </form>

                    {/* Mobile toggle */}
                    <p className="mt-5 text-center text-sm text-slate-500 lg:hidden">
                      Cần nhận OTP?{" "}
                      <button
                        onClick={() => setIsCheckMode(false)}
                        className="font-semibold text-sky-400 hover:text-sky-300"
                      >
                        Nhận OTP →
                      </button>
                    </p>
                  </div>
                </div>

                {/* ── Right Panel: Nhận OTP ── */}
                <div
                  className={`relative p-8 sm:p-10 transition-opacity duration-500 ${
                    !isCheckMode
                      ? "opacity-100 nf-panel-right-active"
                      : "lg:opacity-0 lg:pointer-events-none nf-panel-hidden"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-cyan-500/5 to-transparent" />
                  <div className="relative flex h-full flex-col justify-center">
                    <div className="mb-6">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-sky-400" />
                        <h2 className="text-xl font-bold text-slate-50">Nhận mã OTP</h2>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        Nhận mã OTP Đăng Nhập
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Bước 1: Gửi OTP */}
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <EmailField
                          accent="sky"
                          cooldown={cooldown}
                          email={email}
                          onChange={setEmail}
                        />
                        <button
                          type="submit"
                          disabled={sendingOtp || otpSent || cooldown > 0}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:opacity-60"
                        >
                          {sendingOtp ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Đang lấy OTP...</>
                          ) : cooldown > 0 ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Chờ {cooldown}s</>
                          ) : otpSent ? (
                            <><CheckCircle2 className="h-4 w-4 text-emerald-300" />Đã lấy OTP</>
                          ) : (
                            <><SendHorizonal className="h-4 w-4" />Lấy mã OTP</>
                          )}
                        </button>
                      </form>

      {/* Bước 2: Hiển thị OTP */}
                      {otpSent && (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 px-4 py-4">
                            {otpResultType === "success" && (
                              <div className="mb-3 flex justify-center scale-75 origin-center">
                                <AnimatedCheckmark />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3">
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Mã OTP
                              </label>
                              <button
                                type="button"
                                onClick={() => { setOtpSent(false); setOtpCode(""); setOtpMessage(null); setOtpResultType(null); }}
                                className="text-xs font-medium text-sky-300 transition-colors hover:text-sky-100"
                              >
                                Lấy lại
                              </button>
                            </div>
                            <div className="relative mt-3">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={8}
                                value={otpCode}
                                readOnly
                                onFocus={(e) => e.currentTarget.select()}
                                placeholder="Đang lấy mã OTP..."
                                className="h-14 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 pr-14 text-center text-2xl font-bold tracking-[0.45em] text-slate-50 placeholder-slate-600 outline-none ring-1 ring-transparent transition-all focus:border-sky-500 focus:ring-sky-500/40"
                              />
                              <button
                                type="button"
                                onClick={handleCopyOtp}
                                disabled={verifyingOtp || otpCode.length < 4}
                                aria-label="Sao chép mã OTP"
                                title="Sao chép mã OTP"
                                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 transition-colors hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {verifyingOtp ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OTP Result */}
                      {otpMessage && otpResultType && (
                        <div>
                          {otpResultType === "error" && (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-center text-sm text-rose-50">
                              <XCircle className="mb-2 h-7 w-7 text-rose-400" />
                              <p className="text-sm font-medium text-rose-100">{otpMessage}</p>
                            </div>
                          )}
                          {otpResultType === "info" && !otpSent && (
                            <div className="rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700">
                              {otpMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mobile toggle */}
                    <p className="mt-5 text-center text-sm text-slate-500 lg:hidden">
                      Muốn thêm hộ gia đình?{" "}
                      <button
                        onClick={() => setIsCheckMode(true)}
                        className="font-semibold text-rose-400 hover:text-rose-300"
                      >
                        ← Kiểm tra
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Sliding Overlay ── */}
              <SlideOverlay
                isCheckMode={isCheckMode}
                onToggle={() => setIsCheckMode(!isCheckMode)}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-600">
              <span>© 2026 Netflix OTP Tool by Mavryk Premium Store</span>
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

      {/* ── Styles ── */}
      <style>{`
        @keyframes nf-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes nf-float-d {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-8px) rotate(45deg); }
        }
        .animate-nf-float  { animation: nf-float   3s ease-in-out infinite; }
        .animate-nf-float-d { animation: nf-float-d 3s ease-in-out infinite 0.5s; }

        @keyframes nf-slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes nf-slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 1023px) {
          .nf-panel-left-active  { animation: nf-slide-in-left  0.4s ease-out forwards; }
          .nf-panel-right-active { animation: nf-slide-in-right 0.4s ease-out forwards; }
          .nf-panel-hidden       { display: none !important; }
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
