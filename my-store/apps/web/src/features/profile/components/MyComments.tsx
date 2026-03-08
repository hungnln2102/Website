import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchUserReviews } from "@/lib/api";

export function MyComments() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-reviews"],
    queryFn: async () => {
      const res = await fetchUserReviews();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });
  const comments = data ?? [];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bình luận của tôi</h2>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 dark:text-red-400">{String(error)}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có bình luận nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-gray-200 dark:border-slate-600 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {c.productName ?? `Sản phẩm #${c.productId}`}
                </span>
                <span className="text-yellow-500">
                  {"★".repeat(Math.round(c.rating))}
                  {"☆".repeat(5 - Math.round(c.rating))}
                </span>
              </div>
              {c.comment && (
                <p className="text-gray-600 dark:text-slate-300 text-sm">{c.comment}</p>
              )}
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-2">
                {c.createdAt ? new Date(c.createdAt).toLocaleDateString("vi-VN") : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
