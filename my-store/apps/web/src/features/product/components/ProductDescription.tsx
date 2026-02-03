"use client";

import { sanitizeHtml } from "@/lib/utils/sanitize";

interface ProductDescriptionProps {
  htmlDescription?: string | null;
  textDescription?: string | null;
}

export function ProductDescription({ htmlDescription, textDescription }: ProductDescriptionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:shadow-xl">
      <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6 sm:py-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
          Chi tiết sản phẩm
        </h2>
      </div>
      <div className="p-5 sm:p-6">
        {htmlDescription ? (
          <div
            className="prose prose-blue max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlDescription) }}
          />
        ) : (
          <div className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-slate-300">
            {textDescription || "Chưa có mô tả"}
          </div>
        )}
      </div>
    </section>
  );
}
