"use client";

import { Sparkles, Shield, Zap } from "lucide-react";
import logo from "@/asset/logo1.png";

interface AuthIllustrationProps {
  isLogin: boolean;
  onToggle: () => void;
}

export function AuthIllustration({ isLogin, onToggle }: AuthIllustrationProps) {
  return (
    <div
      className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 p-12 z-20"
      style={{
        transform: isLogin ? "translateX(0%)" : "translateX(-100%)",
        transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
      }}
    >
      {/* Floating Decorative Elements */}
      <div className="absolute top-8 left-8 h-4 w-4 rounded-full bg-white/20 animate-float" />
      <div className="absolute top-16 right-12 h-3 w-3 rotate-45 bg-white/15 animate-float-delayed" />
      <div className="absolute bottom-20 left-16 h-3 w-3 rotate-45 bg-white/15 animate-float" />
      <div className="absolute bottom-12 right-8 h-4 w-4 rounded-full bg-white/10 animate-float-delayed" />
      <div className="absolute top-1/3 left-8 text-white/20">
        <Sparkles className="h-6 w-6 animate-pulse" />
      </div>
      <div className="absolute bottom-1/3 right-8 text-white/20">
        <Shield className="h-6 w-6 animate-pulse" />
      </div>
      <div className="absolute top-1/2 left-12 text-white/15">
        <Zap className="h-5 w-5 animate-pulse" />
      </div>

      {/* Shop Logo */}
      <div className="relative">
        <div className="h-56 w-56 rounded-full bg-white/10 backdrop-blur-sm shadow-2xl overflow-hidden">
          <img
            src={logo}
            alt="Mavryk Logo"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Text */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-white">
          {isLogin ? "Chào mừng bạn!" : "Tham gia ngay!"}
        </h2>
        <p className="mt-3 text-sm text-white/70 max-w-xs leading-relaxed">
          {isLogin
            ? "Đăng nhập để truy cập vào kho phần mềm bản quyền chính hãng với giá ưu đãi nhất"
            : "Tạo tài khoản để nhận ngay ưu đãi độc quyền và cập nhật sản phẩm mới nhất"}
        </p>

        <button
          onClick={onToggle}
          className="mt-6 rounded-full border-2 border-white/50 bg-transparent px-8 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-indigo-600"
        >
          {isLogin ? "Đăng ký" : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}
