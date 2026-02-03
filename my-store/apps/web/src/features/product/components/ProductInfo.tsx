"use client";

import { Star, Shield, Package, Users } from "lucide-react";

interface ProductInfoProps {
  name: string;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
}

export function ProductInfo({ name, averageRating, reviewCount, salesCount }: ProductInfoProps) {
  const features = [
    { icon: Shield, label: "Bản quyền chính hãng", color: "text-blue-600" },
    { icon: Package, label: "Hỗ trợ cài đặt", color: "text-indigo-600" },
    { icon: Users, label: "Hỗ trợ kỹ thuật 24/7", color: "text-cyan-600" },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md dark:border-slate-700/50 dark:bg-slate-800/80">
      <h1 className="mb-2 text-base font-bold tracking-tight text-gray-900 dark:text-white">
        {name}
      </h1>

      {/* Rating and Sales */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-gray-100 pb-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200 dark:text-slate-700"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              ({reviewCount} đánh giá)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          <Users className="h-3 w-3" />
          <span className="text-xs font-bold uppercase tracking-wide">
            {salesCount.toLocaleString("vi-VN")} đã bán
          </span>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-3 gap-2">
        {features.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50/50 px-2 py-2 transition-all hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-700/30 dark:hover:bg-slate-700/50"
          >
            <item.icon className={`mb-1 h-4 w-4 ${item.color}`} />
            <p className="text-center text-[9px] font-bold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
