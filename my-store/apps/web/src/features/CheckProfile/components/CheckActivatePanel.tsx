import { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Building2,
  XCircle,
  RefreshCw,
  ExternalLink,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
  SendHorizonal,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import type { CheckResultType, FixAdesTransferInfo } from '../checkprofile.types';
import type { OrderKeyItem, OrderKeyResult } from '../checkprofile.api';
import { fetchSingleAccountOtpApi } from '../checkprofile.api';
import { AnimatedCheckmark } from './AnimatedCheckmark';
import { EmailField } from './EmailField';

function TransferTeamCard({ transferInfo }: { transferInfo: FixAdesTransferInfo }) {
  const toneClass =
    transferInfo.statusTone === 'success'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
      : transferInfo.statusTone === 'warning'
        ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
        : transferInfo.statusTone === 'error'
          ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
          : 'border-sky-400/40 bg-sky-500/10 text-sky-100';
  const dotClass =
    transferInfo.statusTone === 'success'
      ? 'bg-emerald-400 shadow-emerald-400/40'
      : transferInfo.statusTone === 'warning'
        ? 'bg-amber-400 shadow-amber-400/40'
        : transferInfo.statusTone === 'error'
          ? 'bg-rose-400 shadow-rose-400/40'
          : 'bg-sky-400 shadow-sky-400/40';
  const currentTeam = transferInfo.currentTeam || 'Chưa xác định';
  const targetTeam = transferInfo.targetTeam || 'Chưa xác định';
  const showTeams = transferInfo.showTeams !== false;

  if (!showTeams) {
    return (
      <div className="rounded-3xl border border-amber-400/60 bg-amber-400/10 px-5 py-7 text-center text-amber-100 shadow-xl ring-1 shadow-amber-500/10 ring-amber-300/20">
        <h3 className="text-base font-extrabold text-amber-100">{transferInfo.statusText}</h3>
        <p className="mt-2 text-xs font-medium text-amber-200/90">
          {'Hãy đồng bộ lại với hệ thống.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-xl ring-1 shadow-purple-950/20 ring-white/5">
      <div
        className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center ${toneClass}`}
      >
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-80">
          {'Trạng thái tài khoản'}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shadow-lg ${dotClass}`} />
          <p className="text-sm font-bold">{transferInfo.statusText}</p>
        </div>
      </div>

      {showTeams && (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-blue-300 uppercase">
              <Building2 className="h-3.5 w-3.5" />
              {'Team hiện tại'}
            </div>
            <p className="mt-3 text-sm leading-snug font-extrabold break-words text-blue-100">
              {currentTeam}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-300/40 bg-purple-500/20 text-purple-100 shadow-lg shadow-purple-500/20">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-emerald-300 uppercase">
              <Building2 className="h-3.5 w-3.5" />
              {'Team mới'}
            </div>
            <p className="mt-3 text-sm leading-snug font-extrabold break-words text-emerald-100">
              {targetTeam}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderAccountCard({
  item,
  orderCode,
}: {
  item: OrderKeyItem;
  orderCode: string;
}) {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Split username and password from item.name
  const nameStr = item.name || '';
  const [emailPart, passPart] = nameStr.split(/[#|]/);
  const email = emailPart?.trim() || '';
  const password = passPart?.trim() || '';

  const [otp, setOtp] = useState<string | null>(item.code || null);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [otpError, setOtpError] = useState<string | null>(null);

  // React to prop changes (e.g. if the user clicks global Refresh/Làm mới)
  useEffect(() => {
    setOtp(item.code || null);
    setOtpError(null);
  }, [item.code]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGetOtp = async () => {
    if (countdown > 0 || loadingOtp) return;
    setLoadingOtp(true);
    setOtpError(null);
    setCountdown(30);

    try {
      const res = await fetchSingleAccountOtpApi(orderCode, email);
      if (res.success) {
        if (res.code) {
          setOtp(res.code);
        } else {
          setOtpError("Không có OTP");
        }
      } else {
        setOtpError(res.error || "Không có OTP");
      }
    } catch (err) {
      setOtpError("Lỗi kết nối");
    } finally {
      setLoadingOtp(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-3 shadow-lg shadow-purple-950/5">
      <div className="space-y-2">
        {/* Email row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tài khoản</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-200 select-all break-all">{email}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(email, setCopiedUser)}
              className="p-1 text-slate-500 hover:text-slate-300 transition"
              title="Copy tài khoản"
            >
              {copiedUser ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Password row */}
        {password && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200 font-mono">
                {showPass ? password : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="p-1 text-slate-500 hover:text-slate-300 transition"
              >
                {showPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(password, setCopiedPass)}
                className="p-1 text-slate-500 hover:text-slate-300 transition"
                title="Copy mật khẩu"
              >
                {copiedPass ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        )}

        {/* OTP Code row */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã OTP</span>
          <div className="flex items-center gap-2">
            {otp ? (
              <>
                <span className="text-sm font-extrabold tracking-wider text-purple-300 font-mono">{otp}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(otp, setCopiedOtp)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition"
                  title="Copy mã OTP"
                >
                  {copiedOtp ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {otpError && (
                  <span className="text-[10px] font-semibold text-amber-400">{otpError}</span>
                )}
                <button
                  type="button"
                  disabled={countdown > 0 || loadingOtp}
                  onClick={handleGetOtp}
                  className="inline-flex h-7 items-center justify-center rounded-lg bg-purple-600/30 px-3 text-[11px] font-bold text-purple-200 hover:bg-purple-600/50 disabled:opacity-50 transition-colors"
                >
                  {loadingOtp ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Đang lấy...
                    </>
                  ) : countdown > 0 ? (
                    `Lấy lại sau ${countdown}s`
                  ) : (
                    "Lấy OTP"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type CheckActivatePanelProps = {
  isCheckMode: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  loading: boolean;
  activating: boolean;
  resultType: CheckResultType;
  message: string | null;
  profileName: string | null;
  transferInfo: FixAdesTransferInfo | null;
  canRenewOnError: boolean;
  onCheckSubmit: (e: React.FormEvent) => void;
  onActivate: () => void;

  checkType: 'email' | 'order-key';
  onCheckTypeChange: (type: 'email' | 'order-key') => void;
  orderCode: string;
  onOrderCodeChange: (value: string) => void;
  orderKeyLoading: boolean;
  orderKeyResult: OrderKeyResult | null;
  orderKeyError: string | null;
  onOrderKeyLookup: (e: React.FormEvent) => void;
  onOrderKeyReset: () => void;
  reportingItem: string | null;
  reportSuccess: string | null;
  reportError: string | null;
  onReportError: (item: { name: string; group: string }) => void;

  otpSent?: boolean;
  otpCode?: string;
  sendingOtp?: boolean;
  otpMessage?: string | null;
  otpResultType?: 'success' | 'error' | 'info' | null;
  onSendOtp?: (e: React.FormEvent) => void;
  onResetOtp?: () => void;
};

export function CheckActivatePanel({
  isCheckMode,
  email,
  onEmailChange,
  loading,
  activating,
  resultType,
  message,
  profileName,
  transferInfo,
  canRenewOnError,
  onCheckSubmit,
  onActivate,

  checkType,
  onCheckTypeChange,
  orderCode,
  onOrderCodeChange,
  orderKeyLoading,
  orderKeyResult,
  orderKeyError,
  onOrderKeyLookup,
  onOrderKeyReset,
  reportingItem,
  reportSuccess,
  reportError,
  onReportError,

  otpSent = false,
  otpCode = '',
  sendingOtp = false,
  otpMessage = null,
  otpResultType = null,
  onSendOtp = () => {},
  onResetOtp = () => {},
}: CheckActivatePanelProps) {
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(30);

  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setInterval(() => {
      setEmailCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);
  const items = orderKeyResult?.items || [];
  const firstItem = items[0];
  const isReporting = reportingItem && firstItem && reportingItem === firstItem.name;
  const showSyncAction = transferInfo?.action === 'sync';
  const showTransferAction = transferInfo?.action === 'renew';
  const showRenewAction =
    !showSyncAction &&
    !showTransferAction &&
    (resultType === 'expired' || (resultType === 'error' && canRenewOnError));

  const isOrderKey = checkType === 'order-key';
  const HeaderIcon = isOrderKey ? KeyRound : Search;
  const titleText = isOrderKey ? 'Tra cứu Mã đơn' : 'Kiểm tra & Kích hoạt';
  const descText = isOrderKey
    ? 'Tra cứu thông tin tài khoản theo mã đơn hàng'
    : 'Kiểm tra trạng thái Adobe profile của bạn';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-400/15 bg-slate-950/55 p-4 shadow-xl shadow-purple-950/15 sm:p-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-8 lg:shadow-none w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent lg:from-purple-500/5" />
      <div className="relative flex h-full flex-col justify-center">
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <HeaderIcon className="h-4 w-4 shrink-0 text-purple-400" />
            <h2 className="text-xl font-extrabold text-slate-50 lg:text-lg lg:font-bold">
              {titleText}
            </h2>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400 lg:mt-1 lg:text-xs">
            {descText}
          </p>
        </div>

        {checkType === 'email' ? (
          <form onSubmit={onCheckSubmit} className="space-y-3">
            <EmailField accent="purple" value={email} onChange={onEmailChange} />

            {activating && (
              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/60 px-5 py-5 text-center">
                <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-sky-400" />
                <p className="text-base font-semibold text-sky-200">Đang chuyển profile...</p>
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <p>
                    Email: <span className="font-medium text-slate-200">{email.trim()}</span>
                  </p>
                  {profileName && (
                    <p>
                      Profile: <span className="font-medium text-slate-200">{profileName}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {!loading && !activating && message && resultType && (
              <div>
                {transferInfo ? (
                  <TransferTeamCard transferInfo={transferInfo} />
                ) : (
                  resultType === 'check-success' && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                      <div className="mb-3 flex flex-col items-center gap-3">
                        <AnimatedCheckmark />
                        <span className="text-base font-bold text-emerald-300">
                          Profile đang hoạt động bình thường!
                        </span>
                      </div>
                      {profileName && (
                        <p className="text-lg font-bold tracking-wide text-emerald-200">
                          {profileName}
                        </p>
                      )}
                      <a
                        href={ROUTES.adobeGuide}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
                      >
                        Hướng dẫn fix lỗi Adobe
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )
                )}

                {!transferInfo && resultType === 'expired' && (
                  <div
                    className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-5 text-center text-sm text-amber-50 shadow-lg ring-1 shadow-amber-500/20 ring-amber-400/15"
                    role="alert"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.12),transparent_55%)]"
                      aria-hidden
                    />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/25 shadow-[0_0_24px_-4px_rgba(251,191,36,0.45)] ring-1 ring-amber-400/50">
                        <AlertTriangle className="h-7 w-7 text-amber-300" strokeWidth={2} />
                      </div>
                      <p className="text-[10px] font-bold tracking-[0.22em] text-amber-400 uppercase">
                        Cần kích hoạt lại
                      </p>
                      <span className="text-base font-bold text-amber-200">Profile hết hạn</span>
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

                {!transferInfo && resultType === 'activate-success' && (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                    <div className="mb-3 flex flex-col items-center gap-3">
                      <AnimatedCheckmark />
                      <span className="text-base font-bold text-emerald-300">
                        Chuyển profile thành công!
                      </span>
                    </div>
                    {profileName && (
                      <p className="text-lg font-bold tracking-wide text-emerald-200">
                        {profileName}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, '', ROUTES.adobeGuide);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-500/40 hover:bg-sky-600"
                    >
                      Hướng dẫn đăng nhập lại Team
                    </button>
                  </div>
                )}

                {!transferInfo && resultType === 'error' && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-50">
                    <XCircle className="mb-2 h-8 w-8 text-rose-400" />
                    <p className="text-sm font-medium text-rose-100">{message}</p>
                  </div>
                )}

                {!transferInfo && resultType === 'info' && (
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-300/45 bg-gradient-to-br from-cyan-950/70 via-slate-900/95 to-indigo-950/70 px-4 py-4 text-sm text-cyan-50 shadow-[0_18px_55px_rgba(6,182,212,0.28)] ring-1 ring-cyan-200/25 before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/12 before:via-transparent before:to-cyan-400/10 before:content-[''] after:pointer-events-none after:absolute after:inset-px after:rounded-[15px] after:border after:border-white/10 after:content-['']">
                    <div className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-cyan-300/25 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-cyan-300 via-sky-400 to-violet-400" />
                    <div className="relative flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200/45 bg-cyan-300/15 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.32)]">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] font-bold tracking-[0.18em] text-cyan-300/90 uppercase">
                          Cần hỗ trợ
                        </p>
                        <p className="text-sm leading-relaxed font-semibold text-slate-50">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showSyncAction ? (
              <button
                type="button"
                onClick={onActivate}
                disabled={loading || activating}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
              >
                {loading || activating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {'Đang đồng bộ...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {'Đồng bộ dữ liệu'}
                  </>
                )}
              </button>
            ) : showTransferAction ? (
              <button
                type="button"
                onClick={onActivate}
                disabled={activating}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
              >
                {activating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {'Đang chuyển profile...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {'Chuyển profile'}
                  </>
                )}
              </button>
            ) : showRenewAction ? (
              <button
                type="button"
                onClick={onActivate}
                disabled={activating}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
              >
                {activating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {resultType === 'error' ? 'Đang gia hạn...' : 'Đang kích hoạt...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {resultType === 'error' ? 'Gia hạn ngay' : 'Kích hoạt lại ngay'}
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading || activating || sendingOtp}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {loading ? 'Đang kiểm tra...' : 'Kiểm tra'}
                </button>

                <button
                  type="button"
                  disabled={loading || activating || sendingOtp || emailCountdown > 0}
                  onClick={(e) => {
                    onSendOtp(e);
                    setEmailCountdown(30);
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
                >
                  {sendingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  {sendingOtp
                    ? 'Đang lấy...'
                    : emailCountdown > 0
                      ? `Chờ ${emailCountdown}s`
                      : 'Lấy OTP'}
                </button>
              </div>
            )}

            {/* OTP Result Display */}
            {otpSent && (
              <div className="mt-4 rounded-2xl border border-sky-500/35 bg-sky-500/10 p-4 animate-in fade-in duration-300">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Mã OTP hiện tại
                  </span>
                  <button
                    type="button"
                    onClick={onResetOtp}
                    className="text-xs font-medium text-sky-300 transition-colors hover:text-sky-100"
                  >
                    Lấy lại
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={otpCode}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                    placeholder="Chưa có mã OTP..."
                    className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 pr-14 text-center text-2xl font-bold tracking-[0.45em] text-slate-50 placeholder-slate-600 ring-1 ring-transparent outline-none focus:border-sky-500 focus:ring-sky-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (otpCode) {
                        navigator.clipboard.writeText(otpCode);
                      }
                    }}
                    disabled={!otpCode}
                    aria-label="Sao chép mã OTP"
                    title="Sao chép mã OTP"
                    className="absolute top-1/2 right-3 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Mã OTP tự động hết hạn sau 3 phút
                </p>
              </div>
            )}

            {otpMessage && otpResultType && (
              <div className="mt-3">
                {otpResultType === 'error' && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-center text-sm text-rose-50">
                    <XCircle className="mb-2 h-7 w-7 text-rose-400" />
                    <p className="text-sm font-medium text-rose-100">{otpMessage}</p>
                  </div>
                )}
                {otpResultType === 'info' && !otpSent && (
                  <div className="rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700 text-center">
                    {otpMessage}
                  </div>
                )}
              </div>
            )}
          </form>
        ) : (
          /* Order Key panel */
          <div className="space-y-4">
            {orderKeyResult ? (
              <div className="space-y-3">
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <button
                    type="button"
                    onClick={onOrderKeyReset}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Quay lại</span>
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-all">
                    Đơn hàng: {orderCode.trim()}
                  </span>
                </div>

                {/* Account list */}
                <div className="max-h-[260px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {items && items.length > 0 ? (
                    items.map((item, idx) => (
                      <OrderAccountCard
                        key={idx}
                        item={item}
                        orderCode={orderCode}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Không tìm thấy tài khoản nào trong đơn hàng này.
                    </div>
                  )}
                </div>

                {/* Report Error / Refresh */}
                {items && items.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      {showReportConfirm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-rose-300 font-medium">Báo lỗi đơn hàng này?</span>
                          <button
                            type="button"
                            disabled={isReporting}
                            onClick={() => {
                              const firstItem = items?.[0];
                              if (firstItem) {
                                onReportError(firstItem);
                              }
                              setShowReportConfirm(false);
                            }}
                            className="rounded bg-rose-600/30 px-2 py-0.5 text-[10px] font-bold text-rose-200 hover:bg-rose-600/50 transition-colors"
                          >
                            Đồng ý
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReportConfirm(false)}
                            className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:bg-slate-700 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isReporting}
                          onClick={() => setShowReportConfirm(true)}
                          className="inline-flex items-center gap-1 font-bold text-rose-400 hover:text-rose-300 disabled:opacity-50 transition"
                        >
                          {isReporting ? (
                            <>
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              <span>Đang gửi...</span>
                            </>
                          ) : (
                            <span>Báo lỗi tài khoản</span>
                          )}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={orderKeyLoading}
                      onClick={onOrderKeyLookup}
                      className="inline-flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${orderKeyLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </button>
                  </div>
                )}

                {/* Success/Error Alerts */}
                {reportSuccess && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center font-medium">
                    {reportSuccess}
                  </div>
                )}
                {reportError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-center font-medium">
                    {reportError}
                  </div>
                )}
              </div>
            ) : (
              /* Search Form */
              <form onSubmit={onOrderKeyLookup} className="space-y-4">
                <div className="group relative rounded-2xl border border-white/10 bg-slate-900/40 p-4 transition-all focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50">
                  <label
                    htmlFor="order-code"
                    className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Mã đơn hàng (Key)
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 shrink-0 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      id="order-code"
                      type="text"
                      required
                      placeholder="Nhập mã đơn hàng của bạn..."
                      value={orderCode}
                      onChange={(e) => onOrderCodeChange(e.target.value)}
                      disabled={orderKeyLoading}
                      className="w-full bg-transparent text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {orderKeyError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>{orderKeyError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={orderKeyLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 disabled:opacity-60 lg:h-10 lg:rounded-xl lg:text-xs"
                >
                  {orderKeyLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tra cứu đơn...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Tra cứu đơn hàng</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

