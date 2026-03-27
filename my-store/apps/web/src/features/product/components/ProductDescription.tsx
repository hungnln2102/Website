"use client";

import { sanitizeHtml } from "@/lib/utils/sanitize";
import {
  getCustomerFacingDescription,
  isInternalProductPlaceholder,
} from "../utils/contentPresentation";

interface ProductDescriptionProps {
  htmlDescription?: string | null;
  textDescription?: string | null;
  pendingMessage?: string | null;
}

export function ProductDescription({
  htmlDescription,
  textDescription,
  pendingMessage,
}: ProductDescriptionProps) {
  const shouldRenderHtml =
    !!htmlDescription && !isInternalProductPlaceholder(htmlDescription);
  const fallbackDescription = getCustomerFacingDescription(textDescription);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:shadow-xl">
      <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6 sm:py-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
          {"Th\u00f4ng tin s\u1ea3n ph\u1ea9m"}
        </h2>
      </div>
      <div className="p-5 sm:p-6">
        {pendingMessage ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-5 text-sm font-medium leading-relaxed text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            {pendingMessage}
          </div>
        ) : shouldRenderHtml ? (
          <div
            className="product-rich-html product-rich-html--description"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlDescription) }}
          />
        ) : (
          <div className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-slate-300">
            {fallbackDescription}
          </div>
        )}
      </div>
    </section>
  );
}
