"use client";

import { Shield } from "lucide-react";
import { sanitizeHtml } from "@/lib/utils/sanitize";

interface PurchasePolicyProps {
  htmlPolicy?: string | null;
  textPolicy?: string | null;
}

export function PurchasePolicy({ htmlPolicy, textPolicy }: PurchasePolicyProps) {
  const defaultPolicy =
    "Quý khách vui lòng kiểm tra kỹ gói sản phẩm trước khi thanh toán. Liên hệ hỗ trợ nếu cần tư vấn.";

  return (
    <div className="sticky top-24 space-y-6">
      <div className="rounded-2xl border border-gray-200/50 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 shadow-xl shadow-blue-500/20 text-white">
        <h3 className="mb-4 text-lg font-bold">Chính sách mua hàng</h3>
        <div className="space-y-4 text-sm font-medium leading-relaxed text-blue-50/90">
          {htmlPolicy ? (
            <div
              className="prose prose-sm prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlPolicy) }}
            />
          ) : (
            <p>{textPolicy || defaultPolicy}</p>
          )}
        </div>
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-200" />
            <span className="text-sm font-bold">Thanh toán bảo mật 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
