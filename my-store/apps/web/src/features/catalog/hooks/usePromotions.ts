import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchPromotions } from "@/lib/api";
import type { PromotionDto } from "@/lib/types";
import { QUERY_KEYS } from "@/lib/constants";
import type { NormalizedProduct } from "./useProducts";

/**
 * Custom hook to fetch and normalize promotions
 */
export const usePromotions = () => {
  const {
    data: promotions = [],
    isLoading: loadingPromotions,
  } = useQuery({
    queryKey: QUERY_KEYS.promotions,
    queryFn: fetchPromotions,
  });

  const promotionProducts = useMemo<NormalizedProduct[]>(
    () =>
      promotions.map((p: PromotionDto) => ({
        ...p,
        id: String(p.id),
        category_id: null,
        full_description: null,
        is_featured: false,
        purchase_rules: null,
        created_at: p.created_at ?? new Date().toISOString(),
      })),
    [promotions]
  );

  return {
    promotions: promotionProducts,
    isLoading: loadingPromotions,
  };
};
