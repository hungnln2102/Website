import { useState, useCallback } from "react";
import {
  KeyRound,
  Loader2,
  SendHorizonal,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import type { OtpResultType } from "../checkprofile.types";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { EmailField } from "./EmailField";

type OtpPanelProps = {
  isCheckMode: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  otpSent: boolean;
  otpCode: string;
  sendingOtp: boolean;
  otpMessage: string | null;
  otpResultType: OtpResultType;
  onSendOtp: (e: React.FormEvent) => void;
  onResetOtp: () => void;
  onSwitchToCheck: () => void;
};

export function OtpPanel({
  isCheckMode,
  email,
  onEmailChange,
  otpSent,
  otpCode,
  sendingOtp,
  otpMessage,
  otpResultType,
  onSendOtp,
  onResetOtp,
  onSwitchToCheck,
}: OtpPanelProps) {
  const [otpCopied, setOtpCopied] = useState(false);

  const handleCopyOtp = useCallback(async () => {
    const raw = otpCode.replace(/\s/g, "");
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      setOtpCopied(true);
      window.setTimeout(() => setOtpCopied(false), 2000);
    } catch {
      setOtpCopied(false);
    }
  }, [otpCode]);

  return (
    <div
      className={`relative p-6 sm:p-8 transition-opacity duration-500 ${
        !isCheckMode
          ? "opacity-100 cp-panel-right-active"
          : "lg:opacity-0 lg:pointer-events-none cp-panel-hidden"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_42%),radial-gradient(circle_at_85%_0%,_rgba(168,85,247,0.12),_transparent_44%)]" />
      <div className="relative flex h-full flex-col justify-center">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-800/55 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 shrink-0 text-sky-300" />
                <h2 className="text-lg font-bold text-slate-50">Nhận mã OTP</h2>
              </div>
              <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                Live
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            </p>
          </div>
          <form onSubmit={onSendOtp} className="space-y-3">
            <EmailField
              accent="sky"
              variant="glass"
              compact
              value={email}
              onChange={onEmailChange}
            />
            <button
              type="submit"
              disabled={sendingOtp || otpSent}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-700 text-xs font-semibold text-white shadow-lg transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sendingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lấy OTP...
                </>
              ) : otpSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  OTP đã lấy
                </>
              ) : (
                <>
                  <SendHorizonal className="h-4 w-4" />
                  Lấy mã OTP
                </>
              )}
            </button>
          </form>

          {(otpSent || otpCode) && (
            <div>
              {otpResultType !== "error" && (
                <div className="rounded-xl border border-emerald-400/30 bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 px-3 py-3 text-center">
                  <div className="mb-2 flex flex-col items-center gap-2">
                    <AnimatedCheckmark size="compact" />
                    <p className="text-sm font-semibold text-emerald-300">
                      OTP đã lấy thành công!
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-900/35 px-2 py-2 pl-3 pr-2">
                    <div className="min-w-0 flex-1 text-center font-mono text-lg font-bold tracking-[0.06em] text-slate-50 tabular-nums sm:text-xl sm:tracking-[0.08em]">
                      {otpCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      disabled={!otpCode.replace(/\s/g, "")}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-slate-800/90 px-2 py-1.5 text-[10px] font-semibold text-slate-200 transition-colors hover:border-emerald-400/40 hover:bg-slate-700 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                      aria-label={otpCopied ? "Đã sao chép" : "Sao chép mã OTP"}
                    >
                      {otpCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug text-yellow-200/95">
                    Lưu ý: Mã OTP chỉ tồn tại trong 5 phút. Vui lòng kiểm tra thời gian OTP trước khi nhập.
                  </div>
                </div>
              )}
              {otpMessage && otpResultType === "error" && (
                <div className="mt-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                  {otpMessage}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 lg:hidden">
          Muốn kiểm tra profile?{" "}
          <button
            onClick={onSwitchToCheck}
            className="font-semibold text-purple-400 hover:text-purple-300"
          >
            ← Kiểm tra
          </button>
        </p>
      </div>
    </div>
  );
}
