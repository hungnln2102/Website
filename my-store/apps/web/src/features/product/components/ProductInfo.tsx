"use client";

import { Package, Shield, Star, Users } from "lucide-react";

interface ProductInfoProps {
  heading: string;
  summary: string;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
}

export function ProductInfo({
  heading,
  summary,
  averageRating,
  reviewCount,
  salesCount,
}: ProductInfoProps) {
  const features = [
    {
      icon: Shield,
      displayLabel: "Bản quyền chính hãng",
      color: "text-blue-600",
    },
    {
      icon: Package,
      displayLabel: "Hỗ trợ cài đặt",
      color: "text-indigo-600",
    },
    {
      icon: Users,
      displayLabel: "Hỗ trợ kỹ thuật 24/7",
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md dark:border-slate-700/50 dark:bg-slate-800/80">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
        {"Chi tiết sản phẩm"}
      </p>
      <h1 className="mb-3 text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl">
        {heading}
      </h1>
      <p className="mb-3 line-clamp-3 text-[15px] font-medium leading-6 text-gray-700 dark:text-slate-200">
        {summary}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-gray-100 pb-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`h-3.5 w-3.5 ${
                  index < Math.floor(averageRating)
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
              ({reviewCount} {"đánh giá"})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          <Users className="h-3 w-3" />
          <span className="text-xs font-bold uppercase tracking-wide">
            {salesCount.toLocaleString("vi-VN")} {"đã bán"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {features.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50/50 px-2 py-2 transition-all hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-700/30 dark:hover:bg-slate-700/50"
          >
            <item.icon className={`mb-1 h-4 w-4 ${item.color}`} />
            <p className="text-center text-[9px] font-bold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              {item.displayLabel}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
