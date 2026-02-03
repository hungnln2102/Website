"use client";

import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  highlightedTitle: string;
  count: number;
  countLabel?: string;
  gradientFrom: string;
  gradientVia?: string;
  gradientTo: string;
  iconBgGradient: string;
  iconShadow: string;
  ringColor: string;
  pulseColor: string;
}

export function PageHeader({
  icon: Icon,
  title,
  highlightedTitle,
  count,
  countLabel = "sản phẩm",
  gradientFrom,
  gradientVia,
  gradientTo,
  iconBgGradient,
  iconShadow,
  ringColor,
  pulseColor,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex shrink-0">
          <div className={`absolute inset-0 animate-pulse rounded-xl ${pulseColor}`} />
          <div
            className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${iconBgGradient} shadow-lg ${iconShadow} ring-2 ${ringColor}`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div>
          <h1 className="mb-1 text-2xl font-black tracking-tight text-gray-800 dark:text-white sm:text-3xl">
            {title}{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              {highlightedTitle}
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {count} {countLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
