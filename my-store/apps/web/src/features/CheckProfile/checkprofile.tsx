import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { ServicesSidebar } from './ServicesSidebar';
import { useScroll } from '@/hooks/useScroll';
import { useAuth } from '@/features/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchCategories, productsQueryKey } from '@/lib/api';
import { APP_CONFIG, ROUTES } from '@/lib/constants';
import {
  ShieldCheck,
  Search,
  KeyRound,
  Hash,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { useCheckProfile } from './hooks/useCheckProfile';
import {
  lookupOrderKeyApi,
  reportOrderKeyErrorApi,
  type OrderKeyResult,
} from './checkprofile.api';
import { CheckActivatePanel } from './components/CheckActivatePanel';

type AdobeFormMode = 'checkEmail' | 'orderLookup';

type AdobePanelConfig = {
  mode: AdobeFormMode;
  title: string;
  subtitle: string;
  actionLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: 'purple' | 'indigo';
};

const ADOBE_PANELS: AdobePanelConfig[] = [
  {
    mode: 'checkEmail',
    title: 'Kiểm tra & Nhận OTP',
    subtitle: 'Kiểm tra trạng thái profile và nhận mã OTP nhanh chóng',
    actionLabel: 'Kiểm tra Email',
    Icon: Search,
    accent: 'purple',
  },
  {
    mode: 'orderLookup',
    title: 'Tra cứu Mã đơn',
    subtitle: 'Tra cứu thông tin tài khoản theo mã đơn hàng',
    actionLabel: 'Tra cứu đơn',
    Icon: KeyRound,
    accent: 'indigo',
  },
];

const accentClasses = {
  purple: {
    panel: 'from-purple-700 via-violet-700 to-fuchsia-800 shadow-purple-900/40',
    icon: 'bg-white/10 text-white ring-white/20',
    button: 'border-white/55 text-white hover:bg-white hover:text-purple-700',
    pill: 'bg-purple-500/15 text-purple-100 ring-purple-300/20',
  },
  indigo: {
    panel: 'from-indigo-700 via-blue-700 to-violet-800 shadow-indigo-900/40',
    icon: 'bg-white/10 text-white ring-white/20',
    button: 'border-white/55 text-white hover:bg-white hover:text-indigo-700',
    pill: 'bg-indigo-500/15 text-indigo-100 ring-indigo-300/20',
  },
} as const;

function BookSidePanel({
  panel,
  side,
  onSelect,
}: {
  panel: AdobePanelConfig;
  side: 'left' | 'right';
  onSelect: (mode: AdobeFormMode) => void;
}) {
  const { Icon } = panel;
  const classes = accentClasses[panel.accent];

  return (
    <button
      type="button"
      onClick={() => onSelect(panel.mode)}
      className={`group relative hidden min-h-[540px] overflow-hidden bg-gradient-to-br ${classes.panel} p-6 text-left shadow-2xl transition-all duration-500 hover:brightness-110 lg:flex lg:flex-col lg:items-center lg:justify-center ${
        side === 'left' ? 'rounded-l-3xl' : 'rounded-r-3xl'
      }`}
      aria-label={`Chuyển sang ${panel.title}`}
    >
      <div className="animate-cp-float absolute top-8 left-8 h-4 w-4 rounded-full bg-white/20" />
      <div className="animate-cp-float-d absolute top-16 right-12 h-3 w-3 rotate-45 bg-white/15" />
      <div className="animate-cp-float absolute bottom-20 left-12 h-3 w-3 rotate-45 bg-white/15" />
      <div className="animate-cp-float-d absolute right-10 bottom-12 h-4 w-4 rounded-full bg-white/10" />
      <Sparkles className="absolute top-1/3 left-8 h-6 w-6 text-white/20" />
      <Shield className="absolute right-8 bottom-1/3 h-6 w-6 text-white/20" />
      <Zap className="absolute top-1/2 left-12 h-5 w-5 text-white/15" />

      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-2xl ring-1 ring-white/20 transition-transform duration-500 group-hover:scale-110">
        <Icon className="h-10 w-10 text-white" />
      </div>
      <div className="relative mt-7 text-center">
        <div
          className={`mx-auto mb-4 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${classes.pill}`}
        >
          Bấm để mở trang
        </div>
        <h2 className="text-2xl font-bold text-white">{panel.title}</h2>
        <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/75">{panel.subtitle}</p>
        <span
          className={`mt-6 inline-flex rounded-full border-2 px-7 py-2.5 text-sm font-bold transition-all duration-300 ${classes.button}`}
        >
          {side === 'left' ? '← ' : ''}
          {panel.actionLabel}
          {side === 'right' ? ' →' : ''}
        </span>
      </div>
    </button>
  );
}


export default function CheckProfilePage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const cp = useCheckProfile();

  // Active Mode for 3 columns book-style
  const [activeMode, setActiveMode] = useState<AdobeFormMode>('checkEmail');

  // Order Key states
  const [checkType, setCheckType] = useState<'email' | 'order-key'>('email');
  const [orderCode, setOrderCode] = useState('');
  const [orderKeyLoading, setOrderKeyLoading] = useState(false);
  const [orderKeyResult, setOrderKeyResult] = useState<OrderKeyResult | null>(null);
  const [orderKeyError, setOrderKeyError] = useState<string | null>(null);

  const [reportingItem, setReportingItem] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleActiveModeChange = (mode: AdobeFormMode) => {
    setActiveMode(mode);
    if (mode === 'checkEmail') {
      cp.setIsCheckMode(true);
      setCheckType('email');
    } else if (mode === 'orderLookup') {
      cp.setIsCheckMode(true);
      setCheckType('order-key');
    }
  };

  const handleOrderKeyLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      setOrderKeyError('Vui lòng nhập mã đơn hàng.');
      return;
    }
    setOrderKeyError(null);
    setOrderKeyResult(null);
    setReportSuccess(null);
    setReportError(null);
    setOrderKeyLoading(true);

    try {
      const res = await lookupOrderKeyApi(orderCode.trim());
      if (res.success) {
        setOrderKeyResult(res);
      } else {
        setOrderKeyError(res.error || 'Không tìm thấy thông tin đơn hàng.');
      }
    } catch (err) {
      setOrderKeyError((err as Error).message || 'Lỗi kết nối.');
    } finally {
      setOrderKeyLoading(false);
    }
  };

  const handleOrderKeyReportError = async (item: { name: string; group: string }) => {
    setReportSuccess(null);
    setReportError(null);
    setReportingItem(item.name);

    try {
      const res = await reportOrderKeyErrorApi(orderCode.trim(), item.group, item.name);
      if (res.success) {
        setReportSuccess(res.message || `Đã báo cáo lỗi cho tài khoản ${item.name} thành công.`);
      } else {
        setReportError(res.error || 'Gửi báo cáo lỗi thất bại.');
      }
    } catch (err) {
      setReportError((err as Error).message || 'Lỗi kết nối khi gửi báo cáo lỗi.');
    } finally {
      setReportingItem(null);
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
          <div className="w-full max-w-4xl">
            {/* Title */}
            <div className="lg:backdrop-blur-0 mb-4 rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4 shadow-xl shadow-purple-950/20 backdrop-blur sm:mb-5 sm:px-5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <p className="mb-1 text-[11px] font-semibold tracking-[0.24em] text-purple-300/80 uppercase lg:hidden">
                Adobe profile center
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl lg:text-2xl">
                Fix lỗi Adobe
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-400 lg:mt-0.5 lg:text-xs lg:text-slate-500">
                Kiểm tra, kích hoạt và nhận OTP Adobe profile
              </p>
            </div>

            {/* Main Card */}
            <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-purple-900/25 backdrop-blur lg:min-h-[540px] lg:border-0 lg:bg-slate-900">
              <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-purple-600/15 blur-3xl" />

              <div className={`grid min-h-0 grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:min-h-[540px] lg:gap-0 lg:p-0 ${
                activeMode === 'checkEmail'
                  ? 'lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-[minmax(0,1fr)_220px]'
                  : 'lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]'
              }`}>
                {activeMode === 'orderLookup' && (
                  <BookSidePanel
                    panel={ADOBE_PANELS[0]}
                    side="left"
                    onSelect={handleActiveModeChange}
                  />
                )}

                <div className="relative min-h-0 overflow-hidden rounded-3xl border border-purple-400/15 bg-gradient-to-br from-slate-900 via-slate-905 to-slate-950 px-4 py-5 shadow-xl shadow-purple-950/15 sm:px-6 sm:py-7 lg:min-h-[540px] lg:rounded-none lg:border-0 lg:px-10 lg:py-8 lg:shadow-[inset_22px_0_45px_rgba(2,6,23,0.45),inset_-22px_0_45px_rgba(2,6,23,0.45)]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-8 bg-gradient-to-r from-black/35 to-transparent lg:block" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-8 bg-gradient-to-l from-black/35 to-transparent lg:block" />

                  <div className="relative mx-auto flex h-full max-w-md flex-col justify-center">
                    {/* Mobile tabs grid */}
                    <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
                      {ADOBE_PANELS.map((panel) => {
                        const { Icon } = panel;
                        const isActive = activeMode === panel.mode;
                        return (
                          <button
                            key={panel.mode}
                            type="button"
                            onClick={() => handleActiveModeChange(panel.mode)}
                            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-center text-[11px] font-semibold ring-1 transition-all sm:gap-2 sm:px-3 sm:text-xs ${
                              isActive
                                ? 'bg-purple-600 text-white ring-purple-300/40'
                                : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {panel.actionLabel}
                          </button>
                        );
                      })}
                    </div>

                    {activeMode === 'checkEmail' && (
                      <div className="animate-in fade-in duration-300">
                        <CheckActivatePanel
                          isCheckMode={true}
                          email={cp.email}
                          onEmailChange={cp.setEmail}
                          loading={cp.loading}
                          activating={cp.activating}
                          resultType={cp.resultType}
                          message={cp.message}
                          profileName={cp.profileName}
                          transferInfo={cp.transferInfo}
                          canRenewOnError={cp.canRenewOnError}
                          onCheckSubmit={cp.handleCheckSubmit}
                          onActivate={cp.handleActivate}
                          checkType="email"
                          onCheckTypeChange={setCheckType}
                          orderCode={orderCode}
                          onOrderCodeChange={setOrderCode}
                          orderKeyLoading={orderKeyLoading}
                          orderKeyResult={orderKeyResult}
                          orderKeyError={orderKeyError}
                          onOrderKeyLookup={handleOrderKeyLookup}
                          onOrderKeyReset={() => {}}
                          reportingItem={reportingItem}
                          reportSuccess={reportSuccess}
                          reportError={reportError}
                          onReportError={handleOrderKeyReportError}
                          otpSent={cp.otpSent}
                          otpCode={cp.otpCode}
                          sendingOtp={cp.sendingOtp}
                          otpMessage={cp.otpMessage}
                          otpResultType={cp.otpResultType}
                          onSendOtp={cp.handleSendOtp}
                          onResetOtp={cp.resetOtp}
                        />
                      </div>
                    )}

                    {activeMode === 'orderLookup' && (
                      <div className="animate-in fade-in duration-300">
                        <CheckActivatePanel
                          isCheckMode={true}
                          email={cp.email}
                          onEmailChange={cp.setEmail}
                          loading={cp.loading}
                          activating={cp.activating}
                          resultType={cp.resultType}
                          message={cp.message}
                          profileName={cp.profileName}
                          transferInfo={cp.transferInfo}
                          canRenewOnError={cp.canRenewOnError}
                          onCheckSubmit={cp.handleCheckSubmit}
                          onActivate={cp.handleActivate}
                          checkType="order-key"
                          onCheckTypeChange={setCheckType}
                          orderCode={orderCode}
                          onOrderCodeChange={setOrderCode}
                          orderKeyLoading={orderKeyLoading}
                          orderKeyResult={orderKeyResult}
                          orderKeyError={orderKeyError}
                          onOrderKeyLookup={handleOrderKeyLookup}
                          onOrderKeyReset={() => {
                            setOrderKeyResult(null);
                            setOrderKeyError(null);
                            setReportSuccess(null);
                            setReportError(null);
                          }}
                          reportingItem={reportingItem}
                          reportSuccess={reportSuccess}
                          reportError={reportError}
                          onReportError={handleOrderKeyReportError}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {activeMode === 'checkEmail' && (
                  <BookSidePanel
                    panel={ADOBE_PANELS[1]}
                    side="right"
                    onSelect={handleActiveModeChange}
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-center text-[11px] text-slate-600">
              <span>© 2026 Trung tâm gói — {APP_CONFIG.name}</span>
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
