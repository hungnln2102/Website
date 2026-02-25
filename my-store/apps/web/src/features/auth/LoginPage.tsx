"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./hooks";
import {
  AuthLogo,
  AuthIllustration,
  AuthLoadingScreen,
  AuthNotification,
  AuthStyles,
  LoginForm,
  RegisterForm,
} from "./components";
import type { FieldErrors, RegisterFormData } from "./components/RegisterForm";
import type { LoginFormData } from "./components/LoginForm";
import {
  checkCaptchaRequired,
  checkExistingUser,
  registerUser,
  loginUser,
} from "./services/auth.service";

interface LoginPageProps {
  onBack: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  initialMode?: "login" | "register";
}

export default function LoginPage({ onBack, initialMode = "login" }: LoginPageProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaSiteKey, setCaptchaSiteKey] = useState<string | undefined>();
  const [notification, setNotification] = useState<{
    message: string;
    isVisible: boolean;
    type: "success" | "error";
  }>({
    message: "",
    isVisible: false,
    type: "success",
  });

  // Redirect to home if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      onBack();
    }
  }, [isAuthenticated, isLoading, onBack]);

  // Check if CAPTCHA is required on mount
  useEffect(() => {
    checkCaptchaRequired().then((result) => {
      setCaptchaRequired(result.required);
      setCaptchaSiteKey(result.siteKey);
    });
  }, []);

  // Clear field errors and sync URL when switching forms
  useEffect(() => {
    setFieldErrors({});
    const newPath = isLogin ? "/login" : "/register";
    window.history.replaceState({}, "", newPath);
  }, [isLogin]);

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, isVisible: true, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoggingIn(true);
    try {
      const result = await loginUser({
        usernameOrEmail: data.email,
        password: data.password,
        captchaToken: data.captchaToken,
      });

      if (!result.ok) {
        if (result.requireCaptcha) {
          setCaptchaRequired(true);
          if (result.siteKey) setCaptchaSiteKey(result.siteKey);
        }
        showNotification(result.error || "Đăng nhập thất bại!", "error");
        return;
      }

      // Khi server dùng httpOnly cookie (mavryk_at), không lưu token vào sessionStorage để tránh XSS
      if (!result.useHttpOnlyCookie) {
        if (result.accessToken) sessionStorage.setItem("accessToken", result.accessToken);
        if (result.refreshToken) sessionStorage.setItem("refreshToken", result.refreshToken);
      }
      setCaptchaRequired(false);

      login({
        id: result.user!.id,
        email: result.user!.email,
        username: result.user!.username,
        firstName: result.user!.firstName,
        lastName: result.user!.lastName,
      });
      // Xóa cache profile cũ để lần vào Tổng quan luôn gọi API lấy currentCycle đúng theo user vừa login
      queryClient.removeQueries({ queryKey: ["user-profile"] });

      showNotification("Đăng nhập thành công!", "success");
    } catch {
      showNotification("Không thể kết nối đến server!", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setIsRegistering(true);
    setFieldErrors({});

    try {
      // Check if username or email already exists
      const checkErrors = await checkExistingUser(data.username, data.email);
      
      if (Object.keys(checkErrors).length > 0) {
        setFieldErrors(checkErrors);
        
        // Show error notification
        const errorMessages: string[] = [];
        if (checkErrors.username) errorMessages.push("Tài khoản");
        if (checkErrors.email) errorMessages.push("Email");
        
        showNotification(
          `${errorMessages.join(" và ")} đã tồn tại trong hệ thống!`,
          "error"
        );
        
        setIsRegistering(false);
        return;
      }

      // Register user in database
      const result = await registerUser(data);
      
      if (!result.success) {
        // Handle registration error
        if (result.field === "username") {
          setFieldErrors({ username: result.error });
        } else if (result.field === "email") {
          setFieldErrors({ email: result.error });
        }
        showNotification(result.error || "Đăng ký thất bại!", "error");
        setIsRegistering(false);
        return;
      }
      
      // On success, show notification and switch to login
      showNotification("Đăng ký thành công! Vui lòng đăng nhập.", "success");
      
      // Delay the slide animation to let notification appear first
      setTimeout(() => {
        setIsLogin(true);
      }, 500);
    } catch (error) {
      showNotification("Có lỗi xảy ra, vui lòng thử lại!", "error");
    } finally {
      setIsRegistering(false);
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return <AuthLoadingScreen message="Đang kiểm tra..." />;
  }

  // If authenticated, show redirect loading
  if (isAuthenticated) {
    return <AuthLoadingScreen message="Đang chuyển hướng..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Success/Error Notification */}
      <AuthNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
        autoHideDuration={4000}
      />

      <AuthLogo onBack={onBack} />

      <div className="flex min-h-screen items-center justify-center px-4 py-20 sm:py-16">
        <div className="w-full max-w-5xl">
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 min-h-[650px]">
            {/* Grid with 2 form panels (left and right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[650px]">
              {/* Left Form Panel - Login */}
              <LoginForm
                onSubmit={handleLoginSubmit}
                onSwitchToRegister={() => setIsLogin(false)}
                isActive={isLogin}
                requireCaptcha={captchaRequired}
                captchaSiteKey={captchaSiteKey}
                isLoading={isLoggingIn}
              />

              {/* Right Form Panel - Register */}
              <RegisterForm
                onSubmit={handleRegisterSubmit}
                onSwitchToLogin={() => setIsLogin(true)}
                isActive={!isLogin}
                fieldErrors={fieldErrors}
                isLoading={isRegistering}
              />
            </div>

            {/* Sliding Illustration Overlay */}
            <AuthIllustration isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
          </div>
        </div>
      </div>

      <AuthStyles />
    </div>
  );
}
