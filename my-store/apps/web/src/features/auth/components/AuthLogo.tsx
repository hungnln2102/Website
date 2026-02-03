"use client";

import logo from "@/asset/logo.png";

interface AuthLogoProps {
  onBack: () => void;
}

export function AuthLogo({ onBack }: AuthLogoProps) {
  return (
    <div className="absolute top-6 left-6 z-10 sm:top-8 sm:left-8">
      <button
        onClick={onBack}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-all hover:opacity-80 active:scale-95"
        aria-label="Quay về trang chủ"
      >
        <img
          src={logo}
          alt="Mavryk Logo"
          className="h-10 w-10 rounded-xl object-contain transition-all duration-300"
        />
        <div className="hidden sm:block text-left">
          <h1 className="text-lg font-bold tracking-tight text-white">
            Mavryk Premium <span className="text-blue-200">Store</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            Phần mềm bản quyền chính hãng
          </p>
        </div>
      </button>
    </div>
  );
}
