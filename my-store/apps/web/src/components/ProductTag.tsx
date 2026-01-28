"use client";

import { TrendingUp, Sparkles, Zap } from "lucide-react";

type TagType = "hot" | "new" | "best-selling";

interface ProductTagProps {
  type: TagType;
  className?: string;
}

const tagConfig: Record<TagType, { label: string; icon: typeof TrendingUp; color: string }> = {
  hot: {
    label: "HOT",
    icon: TrendingUp,
    color: "text-blue-400", // Màu xanh sáng với glow
  },
  new: {
    label: "NEW",
    icon: Sparkles,
    color: "text-blue-400",
  },
  "best-selling": {
    label: "BEST SELLING",
    icon: Zap,
    color: "text-blue-400",
  },
};

export default function ProductTag({ type, className = "" }: ProductTagProps) {
  const config = tagConfig[type];
  const Icon = config.icon;
  
  // Tag NEW có style riêng: nền xanh, text và icon trắng
  // Tag BEST SELLING có style riêng: nền cam, text và icon trắng
  const isNewTag = type === "new";
  const isBestSellingTag = type === "best-selling";
  
  const backgroundClass = isNewTag
    ? "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600"
    : isBestSellingTag
    ? "bg-gradient-to-br from-orange-500 via-orange-400 to-red-500"
    : "bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95";
  
  const borderClass = isNewTag
    ? "border-blue-400/50"
    : isBestSellingTag
    ? "border-orange-300/50"
    : "border-slate-700/60";
  
  const textColorClass = isNewTag || isBestSellingTag
    ? "text-white"
    : "text-blue-400";
  
  const iconColorClass = isNewTag || isBestSellingTag
    ? "text-white fill-white"
    : "text-blue-400 fill-current";

  return (
    <div
      className={`relative flex items-center gap-1.5 rounded-lg ${backgroundClass} px-2.5 py-1.5 shadow-lg backdrop-blur-sm border ${borderClass} ${className}`}
    >
      {/* Glow effect background - chỉ cho tag HOT */}
      {type === "hot" && (
        <>
          <div className="absolute inset-0 rounded-lg bg-blue-500/20 blur-md opacity-40" />
          <div className="absolute inset-0 rounded-lg bg-blue-400/10 blur-sm" />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-1.5">
        {/* Icon */}
        {type === "hot" ? (
          <TrendingUp 
            className={`h-3.5 w-3.5 ${iconColorClass}`}
            style={!isNewTag ? {
              filter: 'drop-shadow(0 0 3px rgba(96, 165, 250, 0.9)) drop-shadow(0 0 6px rgba(96, 165, 250, 0.6))',
            } : {}}
          />
        ) : type === "new" ? (
          <Sparkles 
            className={`h-3.5 w-3.5 ${iconColorClass}`}
          />
        ) : (
          <Zap 
            className={`h-3.5 w-3.5 ${iconColorClass}`}
            style={type === "hot" ? {
              filter: 'drop-shadow(0 0 3px rgba(96, 165, 250, 0.9)) drop-shadow(0 0 6px rgba(96, 165, 250, 0.6))',
            } : {}}
          />
        )}
        
        {/* Text */}
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${textColorClass}`}
          style={type === "hot" ? {
            textShadow: '0 0 4px rgba(96, 165, 250, 0.9), 0 0 8px rgba(96, 165, 250, 0.6)',
          } : {}}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
