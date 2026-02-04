"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, Loader2 } from "lucide-react";
import { Turnstile, resetTurnstile } from "./Turnstile";

export interface LoginFormData {
  email: string;
  password: string;
  captchaToken?: string;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  onSwitchToRegister: () => void;
  isActive: boolean;
  requireCaptcha?: boolean;
  captchaSiteKey?: string;
  isLoading?: boolean;
}

export function LoginForm({ 
  onSubmit, 
  onSwitchToRegister, 
  isActive,
  requireCaptcha = false,
  captchaSiteKey,
  isLoading = false,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Reset captcha when form becomes active
  useEffect(() => {
    if (isActive && requireCaptcha) {
      setCaptchaToken(null);
    }
  }, [isActive, requireCaptcha]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If captcha required but not verified
    if (requireCaptcha && !captchaToken) {
      return;
    }
    
    onSubmit({
      ...formData,
      captchaToken: captchaToken || undefined,
    });

    // Reset captcha after submission
    if (requireCaptcha) {
      resetTurnstile();
      setCaptchaToken(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  return (
    <div
      className={`relative p-8 sm:p-10 bg-white dark:bg-slate-900 transition-opacity duration-500 ${
        isActive ? "opacity-100" : "lg:opacity-0 lg:pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
      <div className="relative h-full flex flex-col justify-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đăng nhập</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Chào mừng bạn quay trở lại!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Tài Khoản/Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Tài khoản hoặc Email"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-12 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="ml-2 text-sm text-gray-600 dark:text-slate-400">
                Ghi nhớ đăng nhập
              </span>
            </label>
            <a
              href="#quen-mat-khau"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Quên mật khẩu?
            </a>
          </div>

          {/* CAPTCHA Section - Cloudflare Turnstile */}
          {requireCaptcha && captchaSiteKey && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Vui lòng xác minh bạn không phải robot
                </span>
              </div>
              <Turnstile
                siteKey={captchaSiteKey}
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                theme="auto"
                action="login"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (requireCaptcha && !captchaToken)}
            className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-green-500/30 transition-all hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-600 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* <p className="mt-4 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Đăng ký ngay
          </button>
        </p> */}

      </div>
    </div>
  );
}
