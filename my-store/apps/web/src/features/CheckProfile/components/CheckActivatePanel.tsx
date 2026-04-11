import {
  Search,
  Loader2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { CheckResultType } from "../checkprofile.types";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { EmailField } from "./EmailField";

type CheckActivatePanelProps = {
  isCheckMode: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  loading: boolean;
  activating: boolean;
  resultType: CheckResultType;
  message: string | null;
  profileName: string | null;
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
  onCheckSubmit,
  onActivate,
  onSwitchToOtp,
}: CheckActivatePanelProps) {
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
              <p className="mt-3 text-xs italic text-slate-500">
                Đang mở trình duyệt và đăng nhập...
              </p>
            </div>
          )}

          {!loading && !activating && message && resultType && (
            <div>
              {resultType === "check-success" && (
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

              {resultType === "activate-success" && (
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
              onClick={onActivate}
              disabled={activating}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-xs font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 disabled:opacity-60"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Kích hoạt lại ngay
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
                  Đang kiểm tra...
                </>
              ) : activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Kiểm tra Profile
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
