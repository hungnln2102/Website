"use client";

import { ErrorMessage } from "@/components/ui/error-message";

interface ErrorStatesProps {
  productsError: string | null;
  categoriesError: string | null;
  promotionsError: string | null;
  onRetryProducts: () => void;
  onRetryCategories: () => void;
  onRetryPromotions: () => void;
}

export function ErrorStates({
  productsError,
  categoriesError,
  promotionsError,
  onRetryProducts,
  onRetryCategories,
  onRetryPromotions,
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
    </>
  );
}
