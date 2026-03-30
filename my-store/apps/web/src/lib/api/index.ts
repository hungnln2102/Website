/**
 * API barrel – re-exports all API modules and types so `import { ... } from "@/lib/api"` works.
 */

export { getAuthToken, AUTH_EXPIRED_EVENT, authFetch } from "@/features/auth/api/auth";
export { getApiBase, handleApiError } from "./client";

export { fetchProducts } from "@/features/product/api/products.api";
export { fetchPromotions } from "@/features/catalog/api/promotions.api";
export { fetchCategories } from "@/features/catalog/api/categories.api";
export { fetchProductPackages } from "@/features/product/api/product-packages.api";
export { fetchVariantDetail, fetchVariantFullData, fetchProductInfo } from "@/features/product/api/variant.api";
export {
  checkPaymentHealth,
  createPayment,
  checkPaymentStatus,
  generateOrderId,
  createPaymentCodes,
  confirmBalancePayment,
  confirmTransfer,
} from "@/features/payment/api/payment.api";
export {
  fetchUserProfile,
  fetchUserOrders,
  fetchUserTransactions,
  fetchUserReviews,
  updateProfile,
  changePassword,
  changeEmail,
  getSessions,
  revokeSession,
  getActivity,
} from "@/features/profile/api/user.api";
export { fetchFormFields } from "./forms.api";
export { fetchTopupPackages, fetchTopupTransferCode } from "@/features/wallet/api/topup.api";
export {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCartApi,
  syncCart,
  getCartCount,
} from "@/features/cart/api/cart.api";

export type {
  ProductDto,
  PromotionDto,
  ProductPackageDto,
  CategoryDto,
  VariantDetailDto,
  ProductInfoDto,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  PaymentHealthResponse,
  ConfirmBalancePaymentItem,
  UserOrderItem,
  UserOrder,
  UserProfileDto,
  UserSessionDto,
  UserActivityLogDto,
  WalletTransactionDto,
  FormFieldDto,
  FormFieldsResponse,
  CartItemDto,
  CartResponse,
  CartAddResponse,
  CartCountResponse,
} from "../types";
export type { VariantFullDataDto } from "@/features/product/api/variant.api";
export type { UserReviewDto } from "@/features/profile/api/user.api";
