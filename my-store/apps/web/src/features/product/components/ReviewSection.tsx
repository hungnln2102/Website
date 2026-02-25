"use client";

import { useState } from "react";
import { Star, Check, Send } from "lucide-react";
import { getRatingLabel } from "../utils/reviewUtils";

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
}

interface ReviewSectionProps {
  reviews: Review[];
  averageRating: number;
}

export function ReviewSection({ reviews, averageRating }: ReviewSectionProps) {
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reviewRating === 0) {
      alert("Vui lòng chọn số sao đánh giá");
      return;
    }
    if (!reviewContent.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setReviewSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReviewSubmitting(false);
    setReviewSuccess(true);

    setTimeout(() => {
      setReviewRating(0);
      setReviewContent("");
      setReviewSuccess(false);
    }, 3000);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:shadow-xl">
      <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6 sm:py-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
          Đánh giá thực tế ({reviews.length})
        </h2>
      </div>

      <div className="p-5 sm:p-6">
        {/* Rating Overview */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-2 text-5xl font-bold text-gray-900 dark:text-white">
                {averageRating.toFixed(1)}
                <span className="text-2xl font-normal text-gray-400">/5</span>
              </div>
              <div className="mb-2 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : i < averageRating
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "text-gray-200 dark:text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{reviews.length} lượt đánh giá</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex w-8 items-center justify-end gap-0.5">
                      <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{star}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs text-gray-500 dark:text-slate-400">
                      {count} đánh giá
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/80">
          <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Viết đánh giá của bạn</h3>

          {reviewSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium text-green-600 dark:text-green-400">Cảm ơn bạn đã gửi đánh giá!</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Đánh giá sẽ được hiển thị sau khi được duyệt.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Đánh giá của bạn <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="cursor-pointer p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (reviewHoverRating || reviewRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-600 dark:text-slate-400">
                      {getRatingLabel(reviewRating)}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="review-content" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Nội dung đánh giá <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review-content"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reviewSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Gửi đánh giá</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-8">
          {reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Star className="mb-3 h-10 w-10 text-gray-200 dark:text-slate-700" />
              <p className="text-gray-500 dark:text-slate-400">Sản phẩm này hiện chưa có đánh giá công khai.</p>
            </div>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="group relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
                    {review.customer_name[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900 dark:text-white">{review.customer_name}</span>
                    <span className="text-xs text-gray-400">Khách hàng đã mua</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-700/30">
                <p className="italic text-gray-600 dark:text-slate-300">"{review.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
