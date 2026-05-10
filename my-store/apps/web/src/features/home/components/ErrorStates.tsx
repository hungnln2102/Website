"use client";

import { ErrorMessage } from "@/components/ui/error-message";

interface ErrorStatesProps {
  productsError: string | null;
  categoriesError: string | null;
  promotionsError: string | null;
  bestSellingVariantsError?: string | null;
  onRetryProducts: () => void;
  onRetryCategories: () => void;
  onRetryPromotions: () => void;
  onRetryBestSellingVariants?: () => void;
}

export function ErrorStates({
  productsError,
  categoriesError,
  promotionsError,
  bestSellingVariantsError,
  onRetryProducts,
  onRetryCategories,
  onRetryPromotions,
  onRetryBestSellingVariants,
}: ErrorStatesProps) {
  return (
    <>
      {productsError && (
        <ErrorMessage
          title="Lỗi tải sản phẩm"
          message={productsError}
          onRetry={onRetryProducts}
          className="mb-4"
        />
      )}

      {categoriesError && (
        <ErrorMessage
          title="Lỗi tải danh mục"
          message={categoriesError}
          onRetry={onRetryCategories}
          className="mb-4"
        />
      )}

      {promotionsError && (
        <ErrorMessage
          title="Lỗi tải khuyến mãi"
          message={promotionsError}
          onRetry={onRetryPromotions}
          className="mb-4"
        />
      )}

      {bestSellingVariantsError && (
        <ErrorMessage
          title="Lỗi tải biến thể bán chạy"
          message={bestSellingVariantsError}
          onRetry={onRetryBestSellingVariants}
          className="mb-4"
        />
      )}
    </>
  );
}
