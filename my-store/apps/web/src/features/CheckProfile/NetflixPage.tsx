import { useState, useEffect, useRef, useCallback } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { ServicesSidebar } from './ServicesSidebar';
import { useScroll } from '@/hooks/useScroll';
import { useAuth } from '@/features/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchCategories, getApiBase, productsQueryKey } from '@/lib/api';
import { APP_CONFIG, ROUTES } from '@/lib/constants';
import {
  ShieldCheck,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Tv,
  KeyRound,
  Hash,
  Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabResultType = 'link' | 'code' | 'text';

interface NetflixTabConfig {
  id: string;
  label: string;
  description: string;
  color: 'rose' | 'amber' | 'emerald' | 'sky' | 'purple' | 'blue';
  apiEndpoint: string;
  inputLabel: string;
  inputPlaceholder: string;
  submitLabel: string;
  resultType: TabResultType;
}

// ─── Fallback hardcode khi API /tabs lỗi ──────────────────────────────────────

const FALLBACK_TABS: NetflixTabConfig[] = [
  {
    id: 'household',
    label: 'Xác minh Hộ gia đình',
    description: 'Lấy link xác minh Household Netflix',
    color: 'rose',
    apiEndpoint: '/api/netflix/public/household',
    inputLabel: 'Email Netflix',
    inputPlaceholder: 'example@email.com',
    submitLabel: 'Lấy link xác minh',
    resultType: 'link',
  },
  {
    id: 'otp',
    label: 'Mã OTP đăng nhập',
    description: 'Lấy mã OTP 4–8 số từ email Netflix',
    color: 'amber',
    apiEndpoint: '/api/netflix/public/send-otp',
    inputLabel: 'Email Netflix',
    inputPlaceholder: 'example@email.com',
    submitLabel: 'Lấy mã OTP',
    resultType: 'code',
  },
  {
    id: 'six-digit',
    label: 'Mã 6 số đăng nhập',
    description: 'Lấy mã xác minh 6 số (TV login)',
    color: 'emerald',
    apiEndpoint: '/api/netflix/public/six-digit-login',
    inputLabel: 'Email Netflix',
    inputPlaceholder: 'example@email.com',
    submitLabel: 'Lấy mã 6 số',
    resultType: 'code',
  },
];

// ─── Accent color maps ─────────────────────────────────────────────────────────

const ACCENT = {
  rose: {
    gradient: 'from-rose-600 to-pink-600',
    gradientHover: 'hover:from-rose-500 hover:to-pink-500',
    shadow: 'shadow-rose-500/25',
    ring: 'ring-rose-400/30',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-100',
    tab: 'bg-rose-500 text-white ring-rose-400/30',
    tabInactive: 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
    input: 'focus:border-rose-500 focus:ring-rose-500/40',
    icon: 'text-rose-400',
    glow: 'bg-rose-600/15',
  },
  amber: {
    gradient: 'from-amber-500 to-orange-500',
    gradientHover: 'hover:from-amber-400 hover:to-orange-400',
    shadow: 'shadow-amber-500/25',
    ring: 'ring-amber-400/30',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-100',
    tab: 'bg-amber-500 text-white ring-amber-400/30',
    tabInactive: 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
    input: 'focus:border-amber-500 focus:ring-amber-500/40',
    icon: 'text-amber-400',
    glow: 'bg-amber-600/15',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-500',
    gradientHover: 'hover:from-emerald-400 hover:to-teal-400',
    shadow: 'shadow-emerald-500/25',
    ring: 'ring-emerald-400/30',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-100',
    tab: 'bg-emerald-500 text-white ring-emerald-400/30',
    tabInactive: 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
    input: 'focus:border-emerald-500 focus:ring-emerald-500/40',
    icon: 'text-emerald-400',
    glow: 'bg-emerald-600/15',
  },
  sky: {
    gradient: 'from-sky-500 to-cyan-500',
    gradientHover: 'hover:from-sky-400 hover:to-cyan-400',
    shadow: 'shadow-sky-500/25',
    ring: 'ring-sky-400/30',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    text: 'text-sky-100',
    tab: 'bg-sky-500 text-white ring-sky-400/30',
    tabInactive: 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
    input: 'focus:border-sky-500 focus:ring-sky-500/40',
    icon: 'text-sky-400',
    glow: 'bg-sky-600/15',
  },
  purple: {
    gradient: 'from-purple-600 to-violet-600',
    gradientHover: 'hover:from-purple-500 hover:to-violet-500',
    shadow: 'shadow-purple-500/25',
    ring: 'ring-purple-400/30',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    text: 'text-purple-100',
    tab: 'bg-purple-500 text-white ring-purple-400/30',
    tabInactive: 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
    input: 'focus:border-purple-500 focus:ring-purple-500/40',
    icon: 'text-purple-400',
    glow: 'bg-purple-600/15',
  },
  blue: {
    gradient: 'from-blue-600 to-indigo-600',
    gradientHover: 'hover:from-blue-500 hover:to-indigo-500',
    shadow: 'shadow-blue-500/25',
    ring: 'ring-blue-400/30',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    text: 'text-blue-100',
    tab: 'bg-blue-500 text-white ring-blue-400/30',
    tabInactive: 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
    input: 'focus:border-blue-500 focus:ring-blue-500/40',
    icon: 'text-blue-400',
    glow: 'bg-blue-600/15',
  },
} as const;

function getAccent(color: NetflixTabConfig['color']) {
  return ACCENT[color] ?? ACCENT.rose;
}

// Icon map theo tab id
function TabIcon({ id, className }: { id: string; className?: string }) {
  if (id === 'household') return <Tv className={className} />;
  if (id === 'otp') return <KeyRound className={className} />;
  if (id === 'six-digit') return <Hash className={className} />;
  return <Sparkles className={className} />;
}

// ─── Animated Checkmark ───────────────────────────────────────────────────────

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

// ─── Shared Result Display ────────────────────────────────────────────────────

interface ResultDisplayProps {
  resultType: TabResultType;
  status: 'success' | 'error' | 'info' | null;
  message: string | null;
  code: string | null;
  link: string | null;
  color: NetflixTabConfig['color'];
  onReset: () => void;
  onCopy: () => Promise<void>;
  copied: boolean;
  copying: boolean;
}

function ResultDisplay({
  resultType,
  status,
  message,
  code,
  link,
  color,
  onReset,
  onCopy,
  copied,
  copying,
}: ResultDisplayProps) {
  const ac = getAccent(color);

  if (!status || !message) return null;

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-center text-sm text-rose-50">
        <XCircle className="mb-2 h-7 w-7 text-rose-400" />
        <p className="font-medium text-rose-100">{message}</p>
      </div>
    );
  }

  if (status === 'info') {
    return (
      <div className="rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700">
        {message}
      </div>
    );
  }

  // success
  if (resultType === 'link' && link) {
    return (
      <div className={`rounded-2xl border ${ac.border} ${ac.bg} px-4 py-5 text-center text-sm`}>
        <div className="mb-3 flex flex-col items-center gap-3">
          <AnimatedCheckmark />
          <p className={`font-semibold ${ac.text}`}>{message}</p>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${ac.gradient} px-4 py-2 text-sm font-semibold text-white shadow-lg ${ac.shadow} ${ac.gradientHover} transition-all`}
        >
          <ExternalLink className="h-4 w-4" />
          Mở link xác minh
        </a>
      </div>
    );
  }

  if (resultType === 'code' && code) {
    return (
      <div className={`rounded-2xl border ${ac.border} ${ac.bg} p-4`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-2 text-sm font-semibold ${ac.text}`}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Mã hiện tại
          </span>
          <button
            type="button"
            onClick={onReset}
            className={`text-xs font-medium ${ac.text} opacity-70 transition-opacity hover:opacity-100`}
          >
            Lấy lại
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className={`h-14 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 pr-14 text-center text-2xl font-bold tracking-[0.45em] text-slate-50 placeholder-slate-600 ring-1 ring-transparent outline-none ${ac.input}`}
          />
          <button
            type="button"
            onClick={onCopy}
            disabled={copying}
            aria-label="Sao chép mã"
            title="Sao chép mã"
            className={`absolute top-1/2 right-3 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border ${ac.border} ${ac.bg} ${ac.icon} hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50 transition-all`}
          >
            {copying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        {message && (
          <p className={`mt-2 text-center text-xs ${ac.text} opacity-70`}>{message}</p>
        )}
      </div>
    );
  }

  // text fallback
  return (
    <div className={`rounded-2xl border ${ac.border} ${ac.bg} px-4 py-4 text-center text-sm`}>
      <p className={`font-medium ${ac.text}`}>{message}</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function NetflixPage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // ── Tabs state ──
  const [tabs, setTabs] = useState<NetflixTabConfig[]>([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string>('household');

  // ── Shared form state ──
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Result state (dùng chung cho mọi tab) ──
  const [status, setStatus] = useState<'success' | 'error' | 'info' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  // ── Cooldown ──
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    if (!seconds) return;
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

  // ── Fetch tabs config from API ──
  useEffect(() => {
    const API_BASE = getApiBase();
    fetch(`${API_BASE}/api/netflix/public/tabs`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.tabs) && data.tabs.length > 0) {
          setTabs(data.tabs);
          setActiveTabId(data.tabs[0].id);
        } else {
          setTabs(FALLBACK_TABS);
          setActiveTabId(FALLBACK_TABS[0].id);
        }
      })
      .catch(() => {
        // Fallback khi mạng lỗi hoặc backend chưa có route
        setTabs(FALLBACK_TABS);
        setActiveTabId(FALLBACK_TABS[0].id);
      })
      .finally(() => setTabsLoading(false));
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const resetResult = useCallback(() => {
    setStatus(null);
    setMessage(null);
    setCode(null);
    setLink(null);
    setCopied(false);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    resetResult();
    setEmail('');
  };

  // ── Submit handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTab) return;
    if (!email.trim()) {
      setMessage('Vui lòng nhập email để tiếp tục.');
      setStatus('info');
      return;
    }
    if (cooldown > 0) return;
    if (loading) return;

    setLoading(true);
    resetResult();

    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}${activeTab.apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (data.cooldown) startCooldown(data.cooldown);

      if (data.ok) {
        setStatus('success');
        setMessage(data.message || 'Thành công!');
        setCode(data.code ? String(data.code).trim() : null);
        setLink(data.link ?? null);
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'Không lấy được kết quả. Vui lòng thử lại.');
      }
    } catch {
      setStatus('error');
      setMessage('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ── Copy handler ──
  const handleCopy = async () => {
    if (!code) return;
    setCopying(true);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setMessage(`Đã sao chép mã ${code}.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(`Mã hiện tại: ${code}`);
    } finally {
      setCopying(false);
    }
  };

  const { data: products = [] } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
    queryFn: fetchProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleLogoClick = () => {
    window.history.pushState({}, '', ROUTES.home);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const ac = activeTab ? getAccent(activeTab.color) : getAccent('rose');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? 'shadow-xl shadow-blue-900/20 backdrop-blur-xl' : ''
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
            slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          }))}
          onProductClick={(slug) => {
            window.history.pushState({}, '', `/${encodeURIComponent(slug)}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          onCategoryClick={(slug) => {
            window.history.pushState({}, '', ROUTES.category(slug));
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          user={user}
          onLogout={logout}
        />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl flex-col gap-4 px-3 py-5 sm:px-4 sm:py-8 lg:flex-row lg:gap-6 lg:py-10">
        <ServicesSidebar />
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="w-full max-w-2xl">

            {/* Title */}
            <div className="mb-4 rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4 shadow-xl shadow-rose-950/20 backdrop-blur sm:mb-5 sm:px-5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <p className="mb-1 text-[11px] font-semibold tracking-[0.24em] text-rose-300/80 uppercase">
                Netflix OTP center
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
                OTP Netflix
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                Công cụ hỗ trợ xác minh và lấy mã OTP Netflix nhanh chóng
              </p>
            </div>

            {/* Main Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-rose-900/25 backdrop-blur">
              {/* Glow */}
              <div className={`pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full ${ac.glow} blur-3xl transition-all duration-500`} />

              <div className="relative p-4 sm:p-6">

                {/* ── Tab Menu Động ── */}
                {tabsLoading ? (
                  <div className="mb-5 flex items-center justify-center gap-2 py-4 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                ) : (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                      const tabAc = getAccent(tab.color);
                      const isActive = activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleTabChange(tab.id)}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition-all sm:text-sm ${
                            isActive
                              ? `${tabAc.tab} shadow-md`
                              : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10'
                          }`}
                        >
                          <TabIcon id={tab.id} className="h-3.5 w-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Form Động ── */}
                {activeTab && (
                  <section className="animate-in fade-in duration-300">
                    {/* Tab header */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2">
                        <TabIcon id={activeTab.id} className={`h-5 w-5 ${ac.icon}`} />
                        <h2 className="text-lg font-bold text-slate-50 sm:text-xl">
                          {activeTab.label}
                        </h2>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{activeTab.description}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Email input */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="netflix-email-input"
                          className="block text-xs font-semibold tracking-wide text-slate-400 uppercase"
                        >
                          {activeTab.inputLabel || 'Email'}
                        </label>
                        <div className="relative">
                          <input
                            id="netflix-email-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={activeTab.inputPlaceholder}
                            autoComplete="email"
                            disabled={loading || cooldown > 0}
                            className={`h-12 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 text-sm text-slate-50 placeholder-slate-500 ring-1 ring-transparent outline-none transition-all ${ac.input} disabled:cursor-not-allowed disabled:opacity-60`}
                          />
                          {cooldown > 0 && (
                            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-slate-400">
                              {cooldown}s
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Result */}
                      {!loading && status && (
                        <ResultDisplay
                          resultType={activeTab.resultType}
                          status={status}
                          message={message}
                          code={code}
                          link={link}
                          color={activeTab.color}
                          onReset={resetResult}
                          onCopy={handleCopy}
                          copied={copied}
                          copying={copying}
                        />
                      )}

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={loading || cooldown > 0}
                        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${ac.gradient} ${ac.gradientHover} px-4 text-sm font-bold text-white shadow-lg ${ac.shadow} transition-all disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TabIcon id={activeTab.id} className="h-4 w-4" />
                        )}
                        {loading
                          ? 'Đang xử lý...'
                          : cooldown > 0
                          ? `Chờ ${cooldown}s`
                          : activeTab.submitLabel}
                      </button>
                    </form>
                  </section>
                )}
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-center text-[11px] text-slate-600">
              <span>© 2026 Netflix OTP Tool by {APP_CONFIG.name}</span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Bảo mật bởi {APP_CONFIG.name}
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Styles */}
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
