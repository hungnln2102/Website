"use client";

import { BRANDING_ASSETS } from "@/lib/brandingAssets";
import { APP_CONFIG } from "@/lib/constants";

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
            {APP_CONFIG.namePrimary}{" "}
            <span className="text-blue-200">{APP_CONFIG.nameAccent}</span>
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/60">
            {APP_CONFIG.tagline}
          </p>
        </div>
      </button>
    </div>
  );
}
