import { useEffect } from "react";
import { APP_CONFIG } from "@/lib/constants";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = `404 - Không tìm thấy | ${APP_CONFIG.name}`;

    let robotsMeta = document.querySelector(
      'meta[name="robots"]'
    ) as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", "noindex, follow");

    return () => {
      robotsMeta?.setAttribute("content", "index, follow");
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <h1 className="mb-2 text-6xl font-bold text-slate-300 dark:text-slate-600">
        404
      </h1>
      <p className="mb-6 text-lg text-slate-600 dark:text-slate-400">
        Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <a
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Quay về trang chủ
      </a>
    </div>
  );
}
