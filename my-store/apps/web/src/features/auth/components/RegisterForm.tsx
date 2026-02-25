"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, UserCircle, IdCard, AlertCircle, Calendar } from "lucide-react";
import {
  validateRegisterForm,
  dateOfBirthToApi,
  formatDateOfBirthInput,
  type RegisterFormData,
  type FieldErrors,
} from "../lib/registerValidation";

export type { RegisterFormData, FieldErrors };

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  onSwitchToLogin: () => void;
  isActive: boolean;
  isHidden?: boolean;
  fieldErrors?: FieldErrors;
  isLoading?: boolean;
}

export function RegisterForm({ 
  onSubmit, 
  onSwitchToLogin, 
  isActive, 
  isHidden,
  fieldErrors = {},
  isLoading = false,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    lastName: "",
    firstName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});

  // Combine field errors from props with local validation errors
  const errors = { ...localErrors, ...fieldErrors };

  // Clear local errors when field errors from props change
  useEffect(() => {
    if (fieldErrors.username) {
      setLocalErrors((prev) => ({ ...prev, username: undefined }));
    }
    if (fieldErrors.email) {
      setLocalErrors((prev) => ({ ...prev, email: undefined }));
    }
  }, [fieldErrors]);

  const validateForm = (): boolean => {
    const newErrors = validateRegisterForm(formData);
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submittedData = {
        ...formData,
        dateOfBirth: dateOfBirthToApi(formData.dateOfBirth || "") || formData.dateOfBirth,
      };
      onSubmit(submittedData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name as keyof FieldErrors]) {
      setLocalErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatDateOfBirthInput(e.target.value);
    setFormData({ ...formData, dateOfBirth: value });
    if (errors.dateOfBirth) {
      setLocalErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
    }
  };

  const getInputClassName = (fieldName: keyof FieldErrors, baseClass: string) => {
    const hasError = errors[fieldName];
    return `${baseClass} ${
      hasError 
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
        : ""
    }`;
  };

  return (
    <div
      className={`relative p-8 sm:p-10 bg-white dark:bg-slate-900 transition-opacity duration-500 ${
        isActive ? "opacity-100 mobile-form-register-active" : "lg:opacity-0 lg:pointer-events-none mobile-form-hidden"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5" />
      <div className="relative h-full flex flex-col justify-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đăng ký</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Tạo tài khoản mới để bắt đầu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ và Tên - 2 inputs cùng hàng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
                Họ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Nhập họ"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
                Tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Nhập tên"
                />
              </div>
            </div>
          </div>

          {/* Tài khoản */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Tài khoản
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <IdCard className={`h-5 w-5 ${errors.username ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={getInputClassName(
                  "username",
                  "w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                )}
                placeholder="Nhập tên tài khoản"
              />
              {errors.username && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.username}
              </p>
            )}
          </div>

          {/* Ngày sinh (customer_profiles.date_of_birth) */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Ngày sinh
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar className={`h-5 w-5 ${errors.dateOfBirth ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <input
                type="text"
                name="dateOfBirth"
                value={formData.dateOfBirth || ""}
                onChange={handleDateChange}
                maxLength={10}
                className={getInputClassName(
                  "dateOfBirth",
                  "w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                )}
                placeholder="dd/mm/yyyy"
              />
              {errors.dateOfBirth && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.dateOfBirth && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.dateOfBirth}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className={`h-5 w-5 ${errors.email ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={getInputClassName(
                  "email",
                  "w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                )}
                placeholder="your@email.com"
              />
              {errors.email && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className={`h-5 w-5 ${errors.password ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={getInputClassName(
                  "password",
                  "w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-12 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                )}
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
            {errors.password && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className={`h-5 w-5 ${errors.confirmPassword ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={getInputClassName(
                  "confirmPassword",
                  "w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-12 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-green-500/30 transition-all hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        {/* Mobile-only toggle link */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400 lg:hidden">
          Đã có tài khoản?{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Đăng nhập
          </button>
        </p>

      </div>
    </div>
  );
}
