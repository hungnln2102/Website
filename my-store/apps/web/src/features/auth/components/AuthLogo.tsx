"use client";

import { BRANDING_ASSETS } from "@/lib/brandingAssets";

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
          src={BRANDING_ASSETS.logoTransparent}
          alt="Mavryk Logo"
          width={160}
          height={48}
          className="h-10 w-auto max-h-10 max-w-[11rem] shrink-0 rounded-xl object-contain object-left transition-all duration-300"
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
