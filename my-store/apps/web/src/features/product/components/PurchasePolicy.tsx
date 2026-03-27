"use client";

import { Shield } from "lucide-react";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import {
  getCustomerFacingPolicy,
  isInternalProductPlaceholder,
} from "../utils/contentPresentation";

interface PurchasePolicyProps {
  htmlPolicy?: string | null;
  textPolicy?: string | null;
  pendingMessage?: string | null;
}

export function PurchasePolicy({
  htmlPolicy,
  textPolicy,
  pendingMessage,
}: PurchasePolicyProps) {
  const shouldRenderHtml =
    !!htmlPolicy && !isInternalProductPlaceholder(htmlPolicy);
  const fallbackPolicy = getCustomerFacingPolicy(textPolicy);

  return (
    <div className="sticky top-24 space-y-6">
      <div className="product-policy-card">
        <div className="relative z-10">
          <h3 className="mb-4 text-lg font-bold text-white">
            {"Chính sách mua hàng"}
          </h3>

          <div className="space-y-4 text-sm font-medium leading-relaxed text-blue-50/90">
            {pendingMessage ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm leading-relaxed text-blue-50/90">
                {pendingMessage}
              </div>
            ) : shouldRenderHtml ? (
              <div
                className="product-rich-html product-rich-html--policy"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlPolicy) }}
              />
            ) : (
              <p>{fallbackPolicy}</p>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-200" />
              <span className="text-sm font-bold text-white">
                {"Thanh toán bảo mật 100%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
