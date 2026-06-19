import {
  Search,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Building2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { CheckResultType, FixAdesTransferInfo } from "../checkprofile.types";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { EmailField } from "./EmailField";


function TransferTeamCard({ transferInfo }: { transferInfo: FixAdesTransferInfo }) {
  const toneClass =
    transferInfo.statusTone === "success"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
      : transferInfo.statusTone === "warning"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
        : transferInfo.statusTone === "error"
          ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
          : "border-sky-400/40 bg-sky-500/10 text-sky-100";
  const dotClass =
    transferInfo.statusTone === "success"
      ? "bg-emerald-400 shadow-emerald-400/40"
      : transferInfo.statusTone === "warning"
        ? "bg-amber-400 shadow-amber-400/40"
        : transferInfo.statusTone === "error"
          ? "bg-rose-400 shadow-rose-400/40"
          : "bg-sky-400 shadow-sky-400/40";
  const currentTeam = transferInfo.currentTeam || "Chưa xác định";
  const targetTeam = transferInfo.targetTeam || "Ch?a x?c ??nh";
  const showTeams = transferInfo.showTeams !== false;

  if (!showTeams) {
    return (
      <div className="rounded-3xl border border-amber-400/60 bg-amber-400/10 px-5 py-7 text-center text-amber-100 shadow-xl shadow-amber-500/10 ring-1 ring-amber-300/20">
        <h3 className="text-base font-extrabold text-amber-100">
          {transferInfo.statusText}
        </h3>
        <p className="mt-2 text-xs font-medium text-amber-200/90">
          {"Hãy đồng bộ lại với hệ thống."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/60 p-3 shadow-xl shadow-purple-950/20 ring-1 ring-white/5">
      <div className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center ${toneClass}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">
          {"Trạng thái tài khoản"}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shadow-lg ${dotClass}`} />
          <p className="text-sm font-bold">{transferInfo.statusText}</p>
        </div>
      </div>

      {showTeams && (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">
            <Building2 className="h-3.5 w-3.5" />
            {"Team hiện tại"}
          </div>
          <p className="mt-3 break-words text-sm font-extrabold leading-snug text-blue-100">
            {currentTeam}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-300/40 bg-purple-500/20 text-purple-100 shadow-lg shadow-purple-500/20">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            <Building2 className="h-3.5 w-3.5" />
            {"Team mới"}
          </div>
          <p className="mt-3 break-words text-sm font-extrabold leading-snug text-emerald-100">
            {targetTeam}
          </p>
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
  onSwitchToOtp: () => void;
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
  onSwitchToOtp,
}: CheckActivatePanelProps) {
  const showSyncAction = transferInfo?.action === "sync";
  const showTransferAction = transferInfo?.action === "renew";
  const showRenewAction = !showSyncAction && !showTransferAction && (resultType === "expired" || (resultType === "error" && canRenewOnError));

  return (
    <div
      className={`relative p-6 sm:p-8 transition-opacity duration-500 ${
        isCheckMode
          ? "opacity-100 cp-panel-left-active"
          : "lg:opacity-0 lg:pointer-events-none cp-panel-hidden"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent" />
      <div className="relative flex h-full flex-col justify-center">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-purple-400" />
            <h2 className="text-lg font-bold text-slate-50">
              Kiểm tra & Kích hoạt
            </h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Kiểm tra trạng thái Adobe profile của bạn
          </p>
        </div>

        <form onSubmit={onCheckSubmit} className="space-y-3">
          <EmailField accent="purple" value={email} onChange={onEmailChange} />

          {activating && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-950/60 px-5 py-5 text-center">
              <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-sky-400" />
              <p className="text-base font-semibold text-sky-200">
                Đang chuyển profile...
              </p>
              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>
                  Email:{" "}
                  <span className="font-medium text-slate-200">
                    {email.trim()}
                  </span>
                </p>
                {profileName && (
                  <p>
                    Profile:{" "}
                    <span className="font-medium text-slate-200">
                      {profileName}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {!loading && !activating && message && resultType && (
            <div>
              {transferInfo ? (
                <TransferTeamCard transferInfo={transferInfo} />
              ) : resultType === "check-success" && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                  <div className="mb-3 flex flex-col items-center gap-3">
                    <AnimatedCheckmark />
                    <span className="text-base font-bold text-emerald-300">
                      Profile đang hoạt động bình thường!
                    </span>
                  </div>
                  {profileName && (
                    <p className="text-lg font-bold text-emerald-200 tracking-wide">
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
              )}

              {!transferInfo && resultType === "expired" && (
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
                      <AlertTriangle
                        className="h-7 w-7 text-amber-300"
                        strokeWidth={2}
                      />
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

              {!transferInfo && resultType === "activate-success" && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-5 text-center text-sm text-emerald-50">
                  <div className="mb-3 flex flex-col items-center gap-3">
                    <AnimatedCheckmark />
                    <span className="text-base font-bold text-emerald-300">
                      Chuyển profile thành công!
                    </span>
                  </div>
                  {profileName && (
                    <p className="text-lg font-bold text-emerald-200 tracking-wide">
                      {profileName}
                    </p>
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

              {!transferInfo && resultType === "error" && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-50">
                  <XCircle className="mb-2 h-8 w-8 text-rose-400" />
                  <p className="text-sm font-medium text-rose-100">{message}</p>
                </div>
              )}

              {!transferInfo && resultType === "info" && (
                <div className="rounded-xl bg-slate-800/70 px-4 py-3 text-xs text-slate-300 ring-1 ring-slate-700">
                  {message}
                </div>
              )}
            </div>
          )}

          {showSyncAction ? (
            <button
              type="button"
              onClick={onActivate}
              disabled={loading || activating}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60"
            >
              {loading || activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {"Đang đồng bộ..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {"Đồng bộ dữ liệu"}
                </>
              )}
            </button>
          ) : showTransferAction ? (
            <button
              type="button"
              onClick={onActivate}
              disabled={activating}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {"Đang chuyển profile..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {"Chuyển profile"}
                </>
              )}
            </button>
          ) : showRenewAction ? (
            <button
              type="button"
              onClick={onActivate}
              disabled={activating}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {resultType === "error" ? "Đang gia hạn..." : "Đang kích hoạt..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {resultType === "error" ? "Gia hạn ngay" : "Kích hoạt lại ngay"}
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || activating}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {"Đang kiểm tra..."}
                </>
              ) : activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {"Đang kích hoạt..."}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {"Kiểm tra Profile"}
                </>
              )}
            </button>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-slate-500 lg:hidden">
          Cần nhận OTP?{" "}
          <button
            onClick={onSwitchToOtp}
            className="font-semibold text-sky-400 hover:text-sky-300"
          >
            Nhận OTP →
          </button>
        </p>
      </div>
    </div>
  );
}
