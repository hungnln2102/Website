"use client";

import { useEffect } from "react";
import { ErrorMessage } from "@/components/ui/error-message";
import { APP_CONFIG } from "@/lib/constants";

interface ProductNotFoundProps {
  error?: string | null;
  onRetry?: () => void;
  onBack: () => void;
}

export function ProductNotFound({ error, onRetry, onBack }: ProductNotFoundProps) {
  useEffect(() => {
    document.title = `Không tìm thấy sản phẩm | ${APP_CONFIG.name}`;

    let robotsMeta = document.querySelector(
      'meta[name="robots"]'
    ) as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    const prev = robotsMeta.getAttribute("content") || "index, follow";
    robotsMeta.setAttribute("content", "noindex, follow");
    return () => {
      robotsMeta?.setAttribute("content", prev);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="text-center">
        {error && onRetry ? (
          <ErrorMessage
            title="Lỗi tải sản phẩm"
            message={error}
            onRetry={onRetry}
            className="mb-4"
          />
        ) : (
          <p className="mb-4 text-gray-600 dark:text-slate-400">
            Không thể tải được sản phẩm
          </p>
        )}
        <button
          onClick={onBack}
          className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
}
