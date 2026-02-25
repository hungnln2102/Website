"use client";

import { useQuery } from "@tanstack/react-query";
import { Ticket, Tag } from "lucide-react";
import { fetchPromotions } from "@/lib/api";

type PromoRow = {
  stt: number;
  code: string;
  condition: string;
  validUntil: string;
  status: "active" | "expired" | "used";
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getStatusLabel(status: PromoRow["status"]): string {
  const map = { active: "Đang áp dụng", expired: "Hết hạn", used: "Đã sử dụng" };
  return map[status];
}

function getStatusCls(status: PromoRow["status"]): string {
  if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
  if (status === "expired") return "bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
}

export function PromoCodeSection() {
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const rows: PromoRow[] = promotions.length > 0
    ? promotions.slice(0, 20).map((p, i) => ({
        stt: i + 1,
        code: p.slug?.toUpperCase?.() ?? `PROMO-${p.id}`,
        condition: p.discount_percentage
          ? `Giảm ${p.discount_percentage}% đơn hàng`
          : p.name ?? "Theo chương trình",
        validUntil: p.created_at
          ? new Date(new Date(p.created_at).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : "—",
        status: "active" as const,
      }))
    : [
        { stt: 1, code: "GIAM10", condition: "Đơn từ 500.000đ", validUntil: "31/12/2025", status: "active" as const },
        { stt: 2, code: "TET2026", condition: "Giảm 15% tối đa 200.000đ", validUntil: "15/02/2026", status: "active" as const },
        { stt: 3, code: "NEWUSER", condition: "Khách mới, đơn đầu tiên", validUntil: "30/06/2025", status: "expired" as const },
      ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Ticket className="h-6 w-6 text-blue-500" />
        Mã Khuyến Mãi
      </h2>

      <div className="mb-6 max-w-lg">
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          Bạn có thể nhập mã khuyến mãi tại bước thanh toán khi đặt hàng để được giảm giá theo chương trình hiện có.
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Cách sử dụng</p>
          <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-2 list-disc list-inside">
            <li>Thêm sản phẩm vào giỏ hàng và tiến hành thanh toán</li>
            <li>Tại bước thanh toán, nhập mã khuyến mãi vào ô &quot;Mã giảm giá&quot;</li>
            <li>Nhấn áp dụng để được giảm giá theo chương trình</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-slate-300 w-16">STT</th>
                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Mã Khuyến mãi</th>
                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Điều kiện</th>
                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Thời hạn</th>
                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.stt}
                    className="bg-white hover:bg-gray-50/50 dark:bg-slate-900/30 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">{row.stt}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        <Tag className="h-4 w-4" />
                        {row.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-slate-300">{row.condition}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400">
                      {row.validUntil.includes("/") ? row.validUntil : formatDate(row.validUntil)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusCls(row.status)}`}>
                        {getStatusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-500 dark:text-slate-400">
        Mã khuyến mãi và chương trình có thể thay đổi theo từng đợt. Theo dõi trang chủ hoặc fanpage để nhận mã mới.
      </p>
    </div>
  );
}
