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
  ExternalLink,
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

// Unified modern layout helpers


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

            {/* Redesigned Layout: Split Panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] w-full items-stretch">
              
              {/* Left Info/Hero Card */}
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-900/40 via-indigo-950/60 to-slate-950 p-6 flex flex-col justify-between shadow-xl shadow-purple-950/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_60%)]" />
                <div className="relative space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-300 ring-1 ring-purple-300/20">
                      <ShieldCheck className="h-3 w-3 animate-pulse" />
                      Hệ thống Tự động hóa
                    </div>
                    <h3 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">
                      Adobe Tool
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      Giải pháp tự sửa lỗi tài khoản, chuyển đổi profile và nhận mã xác minh OTP tức thì trong vài giây.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        <Search className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Kiểm tra & Sửa lỗi</h4>
                        <p className="mt-0.5 text-[11px] text-slate-400 leading-normal">Quét trạng thái tài khoản và đưa ra giải pháp sửa lỗi nhanh.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Kích hoạt Siêu tốc</h4>
                        <p className="mt-0.5 text-[11px] text-slate-400 leading-normal">Chuyển đổi profile cũ sang profile mới mà không lo mất dữ liệu.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Lấy OTP An toàn</h4>
                        <p className="mt-0.5 text-[11px] text-slate-400 leading-normal">Hệ thống nhận mã xác nhận tự động, bảo mật và cực kỳ nhanh chóng.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-8 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Phiên bản v2.4</span>
                    <a
                      href={ROUTES.adobeGuide}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 transition"
                    >
                      Xem HDSD
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Form Card */}
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-2xl shadow-purple-900/10 backdrop-blur-xl flex flex-col">
                {/* Background glow */}
                <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />

                {/* Tab Selector (Universal for desktop & mobile) */}
                <div className="relative z-10 mb-6 flex rounded-2xl bg-slate-950/80 p-1.5 ring-1 ring-white/5">
                  {ADOBE_PANELS.map((panel) => {
                    const { Icon } = panel;
                    const isActive = activeMode === panel.mode;
                    return (
                      <button
                        key={panel.mode}
                        type="button"
                        onClick={() => handleActiveModeChange(panel.mode)}
                        className={`flex-1 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl text-center text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {panel.actionLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center">
                  {activeMode === 'checkEmail' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
