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
      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
      : transferInfo.statusTone === 'warning'
        ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
        : transferInfo.statusTone === 'error'
          ? 'border-rose-500/30 bg-rose-500/5 text-rose-300'
          : 'border-sky-500/30 bg-sky-500/5 text-sky-300';
  const dotClass =
    transferInfo.statusTone === 'success'
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
      : transferInfo.statusTone === 'warning'
        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
        : transferInfo.statusTone === 'error'
          ? 'bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
          : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]';
  const currentTeam = transferInfo.currentTeam || 'Chưa xác định';
  const targetTeam = transferInfo.targetTeam || 'Chưa xác định';
  const showTeams = transferInfo.showTeams !== false;

  if (!showTeams) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/40 p-5 text-center shadow-lg backdrop-blur-xl">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-amber-300">{transferInfo.statusText}</h3>
        <p className="mt-1 text-[11px] text-slate-400">
          Hãy thực hiện đồng bộ lại dữ liệu với hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-xl backdrop-blur-xl">
      <div className={`flex items-center justify-between rounded-xl border p-3 ${toneClass}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Trạng thái</span>
        </div>
        <span className="text-xs font-bold">{transferInfo.statusText}</span>
      </div>

      {showTeams && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex-1 rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Team hiện tại</span>
            <span className="mt-1 block text-xs font-bold text-slate-200 truncate">{currentTeam}</span>
          </div>

          <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-md">
            <ArrowRight className="h-4 w-4" />
          </div>

          <div className="flex-1 rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Team mới</span>
            <span className="mt-1 block text-xs font-bold text-slate-200 truncate">{targetTeam}</span>
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

  const nameStr = item.name || '';
  const sepIdx = nameStr.search(/[#|]/);
  const emailPart = sepIdx >= 0 ? nameStr.slice(0, sepIdx) : nameStr;
  const passPart = sepIdx >= 0 ? nameStr.slice(sepIdx + 1) : '';
  const email = emailPart?.trim() || '';
  const password = passPart?.trim() || '';

  const [otp, setOtp] = useState<string | null>(item.code || null);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    setOtp(item.code || null);
    setOtpError(null);
  }, [item.code]);

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

  const isPendingReport = item.report_status === 'pending';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-lg backdrop-blur-md hover:border-purple-500/30 transition-all duration-300">
      {isPendingReport ? (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span className="text-xs font-semibold text-rose-300">
            Tài khoản này đã được báo lỗi, vui lòng chờ đến khi tài khoản hiển thị lại là đã được xử lý.
          </span>
        </div>
      ) : (
      <div className="space-y-3">
        {/* Email Row */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tài khoản</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-200 select-all truncate flex-1 min-w-0">{email}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(email, setCopiedUser)}
              className="shrink-0 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Copy tài khoản"
            >
              {copiedUser ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Password Row */}
        {password && (
          <div className="space-y-1 border-t border-white/5 pt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200 flex-1 min-w-0 truncate">
                {showPass ? password : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="shrink-0 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(password, setCopiedPass)}
                className="shrink-0 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Copy mật khẩu"
              >
                {copiedPass ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* OTP Code Area */}
        <div className="border-t border-white/5 pt-3 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã OTP</span>
          <div className="flex flex-wrap items-center gap-2">
            {otp ? (
              <>
                <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 font-mono text-sm font-extrabold tracking-wider text-purple-300 border border-purple-500/20">
                  {otp}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(otp, setCopiedOtp)}
                  className="shrink-0 p-2 rounded-lg bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/20 transition"
                  title="Copy mã OTP"
                >
                  {copiedOtp ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </>
            ) : (
              <>
                {otpError && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">{otpError}</span>
                )}
                <button
                  type="button"
                  disabled={countdown > 0 || loadingOtp}
                  onClick={handleGetOtp}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-800 disabled:shadow-none transition-all duration-300 min-w-[100px]"
                >
                  {loadingOtp ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Đang lấy...
                    </>
                  ) : countdown > 0 ? (
                    `Lấy lại sau ${countdown}s`
                  ) : (
                    "Lấy OTP"
                  )}
                </button>
              </>
            )}
          </div>
          {/* Visual countdown progress bar */}
          {!otp && countdown > 0 && (
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
      )}
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
     return (
    <div className="relative w-full">
      <div className="relative flex h-full flex-col justify-center">
        {checkType === 'email' ? (
          <form onSubmit={onCheckSubmit} className="space-y-4">
            <EmailField accent="purple" variant="glass" value={email} onChange={onEmailChange} />

            {activating && (
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/40 px-5 py-6 text-center backdrop-blur-md">
                <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-sky-400" />
                <p className="text-sm font-bold text-sky-200">Đang chuyển profile...</p>
                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <p>
                    Email: <span className="font-semibold text-slate-200">{email.trim()}</span>
                  </p>
                  {profileName && (
                    <p>
                      Profile: <span className="font-semibold text-slate-200">{profileName}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {!loading && !activating && message && resultType && (
              <div className="animate-in fade-in duration-300">
                {transferInfo ? (
                  <TransferTeamCard transferInfo={transferInfo} />
                ) : (
                  resultType === 'check-success' && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-6 text-center text-sm text-emerald-50 backdrop-blur-md">
                      <div className="mb-3 flex flex-col items-center gap-3">
                        <AnimatedCheckmark />
                        <span className="text-base font-extrabold text-emerald-400">
                          Profile hoạt động bình thường!
                        </span>
                      </div>
                      {profileName && (
                        <p className="text-lg font-black tracking-wide text-emerald-200 font-mono">
                          {profileName}
                        </p>
                      )}
                      <a
                        href={ROUTES.adobeGuide}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 hover:text-white"
                      >
                        Hướng dẫn fix lỗi Adobe
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )
                )}

                {!transferInfo && resultType === 'expired' && (
                  <div
                    className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-6 text-center text-sm text-amber-50 shadow-lg ring-1 shadow-amber-500/5 ring-amber-400/10 backdrop-blur-md"
                    role="alert"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.08),transparent_55%)]"
                      aria-hidden
                    />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/35 text-amber-400">
                        <AlertTriangle className="h-6 w-6 text-amber-300" strokeWidth={2} />
                      </div>
                      <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase">
                        Cần kích hoạt lại
                      </span>
                      <span className="text-base font-black text-amber-200">Profile đã hết hạn</span>
                      {profileName && (
                        <p className="text-lg font-black tracking-wide text-amber-100 font-mono">
                          {profileName}
                        </p>
                      )}
                      <p className="max-w-md border-t border-amber-500/10 pt-3 text-xs leading-relaxed text-slate-400">
                        {message}
                      </p>
                    </div>
                  </div>
                )}

                {!transferInfo && resultType === 'activate-success' && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-6 text-center text-sm text-emerald-50 backdrop-blur-md">
                    <div className="mb-3 flex flex-col items-center gap-3">
                      <AnimatedCheckmark />
                      <span className="text-base font-extrabold text-emerald-400">
                        Chuyển profile thành công!
                      </span>
                    </div>
                    {profileName && (
                      <p className="text-lg font-black tracking-wide text-emerald-200 font-mono">
                        {profileName}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, '', ROUTES.adobeGuide);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="mt-4 inline-flex w-full h-10 items-center justify-center rounded-xl bg-sky-600 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-500 hover:shadow-lg transition-all"
                    >
                      Hướng dẫn đăng nhập lại Team
                    </button>
                  </div>
                )}

                {!transferInfo && resultType === 'error' && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-6 text-center text-sm text-rose-50 backdrop-blur-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 mb-2">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-rose-200">{message}</p>
                  </div>
                )}

                {!transferInfo && resultType === 'info' && (
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-950/10 px-4 py-5 text-sm text-cyan-50 shadow-lg backdrop-blur-md">
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        <AlertTriangle className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                          Cần hỗ trợ
                        </p>
                        <p className="text-xs leading-relaxed font-semibold text-slate-300">
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="submit"
                    disabled={loading || activating || sendingOtp}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/35 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
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
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:shadow-sky-500/35 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
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

                {/* Email OTP Progress Bar */}
                {emailCountdown > 0 && (
                  <div className="h-1 w-full bg-slate-955 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${(emailCountdown / 30) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* OTP Result Display */}
            {otpSent && (
              <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-50/5 p-4 animate-in fade-in duration-300 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-sky-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Mã OTP hiện tại
                  </span>
                  <button
                    type="button"
                    onClick={onResetOtp}
                    className="text-[11px] font-bold text-sky-400 transition-colors hover:text-sky-300"
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
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 pr-14 text-center text-xl font-bold tracking-[0.45em] text-slate-100 placeholder-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
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
                    className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-500">
                  Mã OTP tự động hết hạn sau 3 phút
                </p>
              </div>
            )}

            {otpMessage && otpResultType && (
              <div className="mt-3">
                {otpResultType === 'error' && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 text-center text-sm text-rose-50">
                    <XCircle className="mb-2 h-7 w-7 text-rose-400" />
                    <p className="text-xs font-bold text-rose-200">{otpMessage}</p>
                  </div>
                )}
                {otpResultType === 'info' && !otpSent && (
                  <div className="rounded-xl bg-slate-900/60 px-4 py-3 text-xs text-slate-400 border border-white/5 text-center font-medium">
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
              <div className="space-y-4">
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <button
                    type="button"
                    onClick={onOrderKeyReset}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-purple-200 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Quay lại</span>
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest select-all font-mono">
                    Đơn hàng: {orderCode.trim()}
                  </span>
                </div>

                {/* Account list */}
                <div className="max-h-[280px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {items && items.length > 0 ? (
                    items.map((item, idx) => (
                      <OrderAccountCard
                        key={idx}
                        item={item}
                        orderCode={orderCode}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Không tìm thấy tài khoản nào trong đơn hàng này.
                    </div>
                  )}
                </div>

                {/* Report Error / Refresh */}
                {items && items.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                    <div>
                      {showReportConfirm ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-rose-400 font-bold">Báo lỗi đơn hàng này?</span>
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
                            className="rounded-lg bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-600/40 hover:text-white transition-colors min-w-[60px]"
                          >
                            Đồng ý
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReportConfirm(false)}
                            className="rounded-lg bg-slate-800 border border-white/5 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors min-w-[50px]"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isReporting}
                          onClick={() => setShowReportConfirm(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-350 disabled:opacity-50 transition py-1"
                        >
                          {isReporting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
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
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition py-1"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${orderKeyLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </button>
                  </div>
                )}

                {/* Success/Error Alerts */}
                {reportSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300 text-center font-bold">
                    {reportSuccess}
                  </div>
                )}
                {reportError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300 text-center font-bold">
                    {reportError}
                  </div>
                )}
              </div>
            ) : (
              /* Search Form */
              <form onSubmit={onOrderKeyLookup} className="space-y-4">
                <div className="group relative rounded-xl border border-white/10 bg-slate-950/40 p-4 transition-all focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50">
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
                      className="w-full bg-transparent text-sm font-bold text-slate-100 placeholder-slate-700 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {orderKeyError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span className="font-bold">{orderKeyError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={orderKeyLoading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/35 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
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

