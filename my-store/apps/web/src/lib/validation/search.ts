import { z } from "zod";

/**
 * Validation schema for search input
 */
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Vui lòng nhập từ khóa tìm kiếm")
    .max(100, "Từ khóa tìm kiếm không được vượt quá 100 ký tự")
    .trim()
    .refine(
      (val) => val.length >= 1,
      "Từ khóa tìm kiếm không được để trống"
    )
    .refine(
      (val) => !/^[\s]+$/.test(val),
      "Từ khóa tìm kiếm không được chỉ có khoảng trắng"
    ),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Validates search query
 */
export function validateSearchQuery(query: string): { isValid: boolean; error?: string } {
  try {
    searchSchema.parse({ query });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Từ khóa tìm kiếm không hợp lệ",
      };
    }
    return { isValid: false, error: "Từ khóa tìm kiếm không hợp lệ" };
  }
}
