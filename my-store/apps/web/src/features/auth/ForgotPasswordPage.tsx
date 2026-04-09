"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./hooks";
import { AuthLoadingScreen, AuthNotification } from "./components";
import { ensureCsrfToken } from "./api/auth";
import { requestPasswordReset, verifyPasswordResetOtp, resetPasswordWithOtp } from "./services/auth.service";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { Mail, Lock, Loader2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const OTP_DIGITS = 6;

function goToLogin() {
  window.history.pushState({}, "", ROUTES.login);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 flex w-full items-center">
      {([1, 2, 3] as const).map((n, idx) => (
        <div key={n} className="flex min-w-0 flex-1 items-center last:flex-none">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
              step >= n
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "border-2 border-gray-200 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
            )}
          >
            {n}
          </div>
          {idx < 2 && (
            <div
              className={cn(
                "mx-2 h-0.5 min-w-[12px] flex-1 rounded-full transition-colors sm:mx-3",
                step > n ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-600"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  /** Sau khi API OTP OK: viền input chuyển lục có animation, rồi mới sang bước 3. */
  const [otpInputVerified, setOtpInputVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    accountIdentifier?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [notification, setNotification] = useState<{
    message: string;
    isVisible: boolean;
    type: "success" | "error";
  }>({ message: "", isVisible: false, type: "success" });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      onBack();
    }
  }, [isAuthenticated, isLoading, onBack]);

  /** Token CSRF trong cookie có thể lệch TTL Redis — lấy mới khi vào trang. */
  useEffect(() => {
    void ensureCsrfToken(true);
  }, []);

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, isVisible: true, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = accountIdentifier.trim();
    if (!u) {
      setFieldErrors({ accountIdentifier: "Vui lòng nhập email hoặc tên đăng nhập" });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(u);
      if (!res.ok) {
        showNotification(res.error || "Không thể gửi mã", "error");
        return;
      }
      showNotification(res.message || "Đã gửi mã (nếu tài khoản tồn tại).", "success");
      setOtp("");
      setOtpInputVerified(false);
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const accountTrimmedRef = useRef(accountIdentifier.trim());
  accountTrimmedRef.current = accountIdentifier.trim();

  /** Đủ 6 chữ số → tự gọi API; cleanup hủy kết quả nếu user sửa OTP trong lúc chờ. */
  useEffect(() => {
    if (step !== 2) return;
    const code = otp.replace(/\s/g, "");
    if (code.length !== OTP_DIGITS || !/^\d+$/.test(code)) return;
    const userKey = accountTrimmedRef.current;
    if (!userKey) return;

    let cancelled = false;
    setSubmitting(true);
    setFieldErrors((prev) => ({ ...prev, otp: undefined }));
    setOtpInputVerified(false);

    void (async () => {
      try {
        const res = await verifyPasswordResetOtp({
          usernameOrEmail: userKey,
          otp: code,
        });
        if (cancelled) return;
        if (!res.ok) {
          setFieldErrors({ otp: res.error || "Mã OTP không đúng hoặc đã hết hạn" });
          return;
        }
        setSubmitting(false);
        setOtpInputVerified(true);
        await new Promise((r) => window.setTimeout(r, 700));
        if (cancelled) return;
        setNewPassword("");
        setConfirmPassword("");
        setStep(3);
        setOtpInputVerified(false);
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    })();

    return () => {
      cancelled = true;
      setSubmitting(false);
    };
  }, [otp, step]);

  const handleResendOtp = async () => {
    const u = accountIdentifier.trim();
    if (!u) return;
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(u);
      if (!res.ok) {
        showNotification(res.error || "Không gửi lại được", "error");
        return;
      }
      showNotification("Đã gửi lại mã (nếu tài khoản tồn tại).", "success");
      setOtp("");
      setFieldErrors((p) => ({ ...p, otp: undefined }));
      setOtpInputVerified(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\s/g, "");
    const errors: typeof fieldErrors = {};
    if (code.length !== OTP_DIGITS || !/^\d+$/.test(code)) {
      errors.otp = `Mã gồm ${OTP_DIGITS} chữ số`;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      errors.newPassword = "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số";
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await resetPasswordWithOtp({
        usernameOrEmail: accountIdentifier.trim(),
        otp: code,
        newPassword,
      });
      if (!res.ok) {
        showNotification(res.error || "Đặt lại mật khẩu thất bại", "error");
        return;
      }
      showNotification(res.message || "Đặt lại mật khẩu thành công!", "success");
      setTimeout(() => goToLogin(), 1000);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <AuthLoadingScreen message="Đang kiểm tra..." />;
  }

  if (isAuthenticated) {
    return <AuthLoadingScreen message="Đang chuyển hướng..." />;
  }

  const stepTitle =
    step === 1 ? "Xác thực email / tài khoản" : step === 2 ? "Nhập mã OTP" : "Đặt mật khẩu mới";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <AuthNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
        autoHideDuration={5000}
      />

      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-3 sm:left-8 sm:top-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-white/80 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Về cửa hàng
        </button>
        <button
          type="button"
          onClick={goToLogin}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Đăng nhập
        </button>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <p className="mb-4 max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
          Làm theo các bước để đặt lại mật khẩu an toàn.
        </p>

        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-10">
          <Stepper step={step} />

          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{stepTitle}</h1>

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email hoặc tên đăng nhập
                </label>
                <div
                  className={cn(
                    "flex overflow-hidden rounded-xl border-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/30",
                    fieldErrors.accountIdentifier
                      ? "border-red-400"
                      : "border-slate-200 dark:border-slate-600"
                  )}
                >
                  <span className="flex items-center justify-center bg-slate-200 px-3 dark:bg-slate-700">
                    <Mail className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                  </span>
                  <input
                    type="text"
                    value={accountIdentifier}
                    onChange={(e) => {
                      setAccountIdentifier(e.target.value);
                      if (fieldErrors.accountIdentifier)
                        setFieldErrors((p) => ({ ...p, accountIdentifier: undefined }));
                    }}
                    className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                    placeholder="Nhập email hoặc tài khoản"
                    autoComplete="username"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Chúng tôi gửi mã xác minh 6 số tới email đăng ký (hiệu lực 15 phút).
                </p>
                {fieldErrors.accountIdentifier && (
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.accountIdentifier}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi mã xác minh"
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mã OTP
                </label>
                <div
                  className={cn(
                    "relative flex overflow-hidden rounded-xl border-2 transition-[border-color,box-shadow] duration-500 ease-out focus-within:ring-2",
                    fieldErrors.otp &&
                      "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)] focus-within:border-red-500 focus-within:ring-red-500/35 dark:border-red-400 dark:shadow-[0_0_0_3px_rgba(248,113,113,0.18)] dark:focus-within:ring-red-400/35",
                    !fieldErrors.otp &&
                      otpInputVerified &&
                      "border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.22)] focus-within:border-emerald-500 focus-within:ring-emerald-400/35 dark:border-emerald-400 dark:shadow-[0_0_0_3px_rgba(52,211,153,0.2)] dark:focus-within:ring-emerald-400/30",
                    !fieldErrors.otp &&
                      !otpInputVerified &&
                      "border-slate-200 focus-within:border-slate-200 focus-within:ring-blue-500/30 dark:border-slate-600 dark:focus-within:border-slate-600"
                  )}
                >
                  <span className="flex items-center justify-center bg-slate-200 px-3 dark:bg-slate-700">
                    <KeyRound className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_DIGITS}
                    value={otp}
                    disabled={otpInputVerified}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_DIGITS));
                      if (fieldErrors.otp) setFieldErrors((p) => ({ ...p, otp: undefined }));
                    }}
                    className={cn(
                      "min-w-0 flex-1 border-0 bg-white py-3 text-center text-lg font-semibold tracking-[0.4em] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-90 dark:bg-slate-800 dark:text-white",
                      submitting ? "pl-3 pr-10" : "px-3"
                    )}
                    placeholder="••••••"
                    aria-busy={submitting}
                    aria-invalid={Boolean(fieldErrors.otp)}
                  />
                  {submitting && (
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center"
                      aria-hidden
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Nhập đủ 6 số để tự động xác minh. Kiểm tra hộp thư và thư mục spam.
                </p>
                {fieldErrors.otp && (
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.otp}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setOtpInputVerified(false);
                    setFieldErrors({});
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={submitting}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 dark:text-blue-400"
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu mới
                </label>
                <div
                  className={cn(
                    "flex overflow-hidden rounded-xl border-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/30",
                    fieldErrors.newPassword ? "border-red-400" : "border-slate-200 dark:border-slate-600"
                  )}
                >
                  <span className="flex items-center justify-center bg-slate-200 px-3 dark:bg-slate-700">
                    <Lock className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.newPassword) setFieldErrors((p) => ({ ...p, newPassword: undefined }));
                    }}
                    className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:bg-slate-800 dark:text-white"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.newPassword && (
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Xác nhận mật khẩu
                </label>
                <div
                  className={cn(
                    "flex overflow-hidden rounded-xl border-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/30",
                    fieldErrors.confirmPassword ? "border-red-400" : "border-slate-200 dark:border-slate-600"
                  )}
                >
                  <span className="flex items-center justify-center bg-slate-200 px-3 dark:bg-slate-700">
                    <Lock className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                    }}
                    className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:bg-slate-800 dark:text-white"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Hoàn tất"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
