import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, fetchPromotions } from "@/lib/api";

export function useCatalogData() {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const {
    data: promotions = [],
    isLoading: loadingPromotions,
    error: promotionsError,
  } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const handleRetryProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [queryClient]);

  const handleRetryPromotions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["promotions"] });
  }, [queryClient]);

  const productsErrorMsg =
    productsError instanceof Error
      ? productsError.message
      : productsError
      ? "Không thể tải danh sách sản phẩm"
      : null;

  const promotionsErrorMsg =
    promotionsError instanceof Error
      ? promotionsError.message
      : promotionsError
      ? "Không thể tải danh sách khuyến mãi"
      : null;

  return {
    products,
    categories,
    promotions,
    loadingProducts,
    loadingPromotions,
    productsError: productsErrorMsg,
    promotionsError: promotionsErrorMsg,
    handleRetryProducts,
    handleRetryPromotions,
  };
}
