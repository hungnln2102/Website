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
  KeyRound,
  CheckCircle2,
  SendHorizonal,
  Sparkles,
  Shield,
  Zap,
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

/* ─── Sliding Overlay (giống AuthIllustration) ───────────────────────────── */
function SlideOverlay({
  isCheckMode,
  onToggle,
}: {
  isCheckMode: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800 p-12 z-20"
      style={{
        transform: isCheckMode ? "translateX(0%)" : "translateX(-100%)",
        transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
      }}
    >
      {/* Floating decorations */}
      <div className="absolute top-8 left-8 h-4 w-4 rounded-full bg-white/20 animate-cp-float" />
      <div className="absolute top-16 right-12 h-3 w-3 rotate-45 bg-white/15 animate-cp-float-d" />
      <div className="absolute bottom-20 left-16 h-3 w-3 rotate-45 bg-white/15 animate-cp-float" />
      <div className="absolute bottom-12 right-8 h-4 w-4 rounded-full bg-white/10 animate-cp-float-d" />
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
          <Search className="h-11 w-11 text-white" />
        )}
      </div>

      {/* Text */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-white">
          {isCheckMode ? "Nhận mã OTP" : "Kiểm tra & Kích hoạt"}
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
          {isCheckMode
            ? "Nhận mã OTP để xác thực Adobe profile của bạn một cách nhanh chóng và bảo mật."
            : "Kiểm tra trạng thái và kích hoạt lại Adobe profile ngay trong một bước."}
        </p>
        <button
          onClick={onToggle}
          className="mt-6 rounded-full border-2 border-white/50 bg-transparent px-8 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-indigo-700"
        >
          {isCheckMode ? "Nhận OTP →" : "← Kiểm tra"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function CheckProfilePage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  /* mode: true = Check/Activate active, false = OTP active */
  const [isCheckMode, setIsCheckMode] = useState(true);

  /* shared email */
  const [email, setEmail] = useState("");

  /* ── Check + Activate state ── */
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resultType, setResultType] = useState<
    "check-success" | "expired" | "activate-success" | "error" | "info" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  /* ── OTP state ── */
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpResultType, setOtpResultType] = useState<
    "success" | "error" | "info" | null
  >(null);

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

  /* ── Kiểm tra Profile ── */
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
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/fix-adobe/check-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const text = await res.clone().text().catch(() => "");
      if (!res.ok) {
        setResultType("error");
        setMessage(
          text
            ? `Không kiểm tra được profile.\n\nThông báo từ server:\n${text}`
            : "Không kiểm tra được profile. Vui lòng thử lại sau."
        );
        return;
      }
      let parsed: Record<string, unknown> | null = null;
      try { parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null; } catch { parsed = null; }

      let type: "check-success" | "expired" | "error" | "info" = "info";
      let finalMessage = "";
      let name: string | null = null;

      if (parsed && typeof parsed === "object") {
        const status = String(parsed.status ?? parsed.result ?? "").toLowerCase();
        name = (parsed.profileName as string) ?? (parsed.profile_name as string) ?? (parsed.profile as string) ?? null;
        const expiredFlag = Boolean(parsed.expired);
        const successFlag = Boolean(parsed.success);
        const foundFlag = parsed.found !== undefined ? Boolean(parsed.found) : undefined;
        if (expiredFlag || status.includes("expired")) {
          type = "expired";
          finalMessage = (parsed.message as string) || (parsed.result_message as string) || "Profile đã hết hạn, vui lòng kích hoạt lại.";
        } else if (successFlag || status === "success" || status === "active") {
          type = "check-success";
          finalMessage = (parsed.message as string) || (parsed.result_message as string) || "Profile đang hoạt động bình thường.";
        } else if (foundFlag === false || status.includes("error") || status.includes("fail") || status === "not_found") {
          type = "error";
          finalMessage = (parsed.message as string) || (parsed.result_message as string) || (parsed.error as string) || "Không tìm thấy profile. Vui lòng liên hệ hỗ trợ.";
        } else {
          type = "info";
          finalMessage = (parsed.message as string) || (parsed.result_message as string) || text;
        }
      } else {
        const normalized = text.toLowerCase();
        finalMessage = text;
        if (normalized.includes("profile active") || normalized.includes("profile is active")) {
          type = "check-success";
          const parts = text.split(":");
          if (parts.length > 1) name = parts.slice(1).join(":").trim();
        } else if (normalized.includes("hết hạn") || normalized.includes("het han") || normalized.includes("expired") || normalized.includes("activate.mkvest.com")) {
          type = "expired";
        } else if (normalized.includes("not in warrant") || normalized.includes("contact seller")) {
          type = "error";
        } else { type = "info"; }
      }
      setMessage(finalMessage);
      setResultType(type);
      setProfileName(name);
    } catch (err) {
      setMessage("Có lỗi kết nối tới máy chủ kiểm tra profile. Vui lòng thử lại sau.");
      console.error("CheckProfile error:", err);
    } finally { setLoading(false); }
  };

  /* ── Kích hoạt Profile ── */
  const handleActivate = async () => {
    if (!email.trim() || activating) return;
    setActivating(true);
    resetResult();
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/fix-adobe/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const text = await res.clone().text().catch(() => "");
      if (!res.ok) {
        setResultType("error");
        setMessage(text ? `Không kích hoạt lại được profile.\n\nThông báo từ server:\n${text}` : "Không kích hoạt lại được profile. Vui lòng thử lại sau.");
        return;
      }
      let parsed: Record<string, unknown> | null = null;
      try { parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null; } catch { parsed = null; }

      let finalMessage = "";
      let type: "activate-success" | "error" | "info" = "info";
      let name: string | null = null;

      if (parsed && typeof parsed === "object") {
        const status = String(parsed.status ?? "").toLowerCase();
        name = (parsed.profile_name as string) ?? (parsed.profile as string) ?? profileName ?? null;
        if (status === "success") {
          type = "activate-success";
          finalMessage = (parsed.message as string) || `Profile đã được kích hoạt thành công cho ${email.trim()}.`;
        } else if (status === "failed") {
          type = "error";
          finalMessage = (parsed.message as string) || (parsed.error as string) || "Kích hoạt lại profile thất bại. Vui lòng liên hệ hỗ trợ.";
        } else if (status === "not_found") {
          type = "error";
          finalMessage = (parsed.message as string) || (parsed.error as string) || "Không tìm thấy tác vụ kích hoạt. Vui lòng thử lại sau.";
        } else {
          type = "info";
          finalMessage = (parsed.message as string) || (parsed.error as string) || text || "Đã gửi yêu cầu kích hoạt lại profile.";
        }
      } else {
        finalMessage = text || "Đã gửi yêu cầu kích hoạt lại profile.";
        type = "info";
      }
      setMessage(finalMessage);
      setResultType(type);
      setProfileName(name);
    } catch (err) {
      console.error("Activate error:", err);
      setResultType("error");
      setMessage("Có lỗi kết nối tới dịch vụ kích hoạt profile. Vui lòng thử lại sau.");
    } finally { setActivating(false); }
  };

  /* ── Gửi OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sendingOtp) return;
    setSendingOtp(true);
    setOtpMessage(null);
    setOtpResultType(null);
    setOtpSent(false);
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/fix-adobe/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const text = await res.clone().text().catch(() => "");
      let parsed: Record<string, unknown> | null = null;
      try { parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null; } catch { parsed = null; }
      if (!res.ok) {
        setOtpResultType("error");
        setOtpMessage((parsed?.message as string) || (parsed?.error as string) || "Không gửi được OTP. Vui lòng thử lại sau.");
        return;
      }
      setOtpSent(true);
      setOtpMessage((parsed?.message as string) || `Mã OTP đã được gửi đến ${email.trim()}. Vui lòng kiểm tra email.`);
      setOtpResultType("info");
    } catch (err) {
      console.error("Send OTP error:", err);
      setOtpResultType("error");
      setOtpMessage("Có lỗi kết nối. Vui lòng thử lại sau.");
    } finally { setSendingOtp(false); }
  };

  /* ── Xác nhận OTP ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otpCode.trim() || verifyingOtp) return;
    setVerifyingOtp(true);
    setOtpMessage(null);
    setOtpResultType(null);
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/fix-adobe/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() }),
      });
      const text = await res.clone().text().catch(() => "");
      let parsed: Record<string, unknown> | null = null;
      try { parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null; } catch { parsed = null; }
      if (!res.ok) {
        setOtpResultType("error");
        setOtpMessage((parsed?.message as string) || (parsed?.error as string) || "Mã OTP không đúng hoặc đã hết hạn.");
        return;
      }
      setOtpResultType("success");
      setOtpMessage((parsed?.message as string) || "Xác nhận OTP thành công! Profile đã được cập nhật.");
      setOtpCode("");
    } catch (err) {
      console.error("Verify OTP error:", err);
      setOtpResultType("error");
      setOtpMessage("Có lỗi kết nối. Vui lòng thử lại sau.");
    } finally { setVerifyingOtp(false); }
  };

  /* ── Email input ── */
  const EmailField = ({ accent }: { accent: "purple" | "sky" }) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Email Adobe
      </label>
      <div className="relative">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your-email@mkvest.com"
          className={`h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-transparent transition-all ${
            accent === "purple"
              ? "focus:border-purple-500 focus:ring-purple-500/40"
              : "focus:border-sky-500 focus:ring-sky-500/40"
          }`}
        />
      </div>
    </div>
  );

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">Fix lỗi Adobe</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Kiểm tra, kích hoạt và nhận OTP Adobe profile
            </p>
          </div>

          {/* ── Main Card ── */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-purple-900/30 min-h-[540px]">
            {/* Glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-purple-600/15 blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[540px]">

              {/* ── Left Panel: Kiểm tra & Kích hoạt ── */}
              <div
                className={`relative p-8 sm:p-10 transition-opacity duration-500 ${
                  isCheckMode
                    ? "opacity-100 cp-panel-left-active"
                    : "lg:opacity-0 lg:pointer-events-none cp-panel-hidden"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent" />
                <div className="relative flex h-full flex-col justify-center">
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
                    <EmailField accent="purple" />

                    {/* Đang kích hoạt */}
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

                    {/* Kết quả */}
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
                          <div
                            className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-5 text-center text-sm text-amber-50 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/15"
                            role="alert"
                          >
                            <div
                              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.12),transparent_55%)]"
                              aria-hidden
                            />
                            <div className="relative flex flex-col items-center gap-3">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/25 ring-1 ring-amber-400/50 shadow-[0_0_24px_-4px_rgba(251,191,36,0.45)]">
                                <AlertTriangle className="h-7 w-7 text-amber-300" strokeWidth={2} />
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
                    ? "opacity-100 cp-panel-right-active"
                    : "lg:opacity-0 lg:pointer-events-none cp-panel-hidden"
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
                      Gửi mã OTP xác thực đến email Adobe của bạn
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Bước 1: Gửi OTP */}
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <EmailField accent="sky" />
                      <button
                        type="submit"
                        disabled={sendingOtp || otpSent}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:opacity-60"
                      >
                        {sendingOtp ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Đang gửi OTP...</>
                        ) : otpSent ? (
                          <><CheckCircle2 className="h-4 w-4 text-emerald-300" />OTP đã được gửi</>
                        ) : (
                          <><SendHorizonal className="h-4 w-4" />Gửi mã OTP</>
                        )}
                      </button>
                    </form>

                    {/* Bước 2: Nhập OTP */}
                    {otpSent && (
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="rounded-xl border border-sky-500/30 bg-sky-950/40 px-4 py-3 text-xs text-sky-300">
                          Mã OTP đã gửi đến{" "}
                          <span className="font-semibold text-sky-200">{email.trim()}</span>.{" "}
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtpCode(""); setOtpMessage(null); setOtpResultType(null); }}
                            className="underline hover:text-sky-100"
                          >
                            Gửi lại?
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Mã OTP
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Nhập mã OTP..."
                            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-center text-lg font-bold tracking-[0.35em] text-slate-100 placeholder-slate-600 outline-none ring-1 ring-transparent transition-all focus:border-sky-500 focus:ring-sky-500/40"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={verifyingOtp || otpCode.length < 4}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-teal-500/50 disabled:opacity-60"
                        >
                          {verifyingOtp ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Đang xác nhận...</>
                          ) : (
                            <><KeyRound className="h-4 w-4" />Xác nhận OTP</>
                          )}
                        </button>
                      </form>
                    )}

                    {/* OTP Result */}
                    {otpMessage && otpResultType && (
                      <div>
                        {otpResultType === "success" && (
                          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                            <div className="mb-3 flex justify-center"><AnimatedCheckmark /></div>
                            <p className="font-bold text-emerald-300">{otpMessage}</p>
                          </div>
                        )}
                        {otpResultType === "error" && (
                          <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-center text-sm text-rose-50">
                            <XCircle className="mb-2 h-7 w-7 text-rose-400" />
                            <p className="text-sm font-medium text-rose-100">{otpMessage}</p>
                          </div>
                        )}
                        {otpResultType === "info" && (
                          <div className="rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700">
                            {otpMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile toggle */}
                  <p className="mt-5 text-center text-sm text-slate-500 lg:hidden">
                    Muốn kiểm tra profile?{" "}
                    <button
                      onClick={() => setIsCheckMode(true)}
                      className="font-semibold text-purple-400 hover:text-purple-300"
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

      {/* ── Styles ── */}
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
