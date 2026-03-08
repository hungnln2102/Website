/**
 * API barrel – re-exports all API modules and types so `import { ... } from "@/lib/api"` works.
 */

export { getAuthToken, AUTH_EXPIRED_EVENT, authFetch } from "./auth";
export { getApiBase, handleApiError } from "./client";

export { fetchProducts } from "./products.api";
export { fetchPromotions } from "./promotions.api";
export { fetchCategories } from "./categories.api";
export { fetchProductPackages } from "./product-packages.api";
export { fetchVariantDetail, fetchVariantFullData, fetchProductInfo } from "./variant.api";
export {
  checkPaymentHealth,
  createPayment,
  checkPaymentStatus,
  generateOrderId,
  createPaymentCodes,
  confirmBalancePayment,
  confirmTransfer,
} from "./payment.api";
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
} from "./user.api";
export { fetchFormFields } from "./forms.api";
export { fetchTopupPackages, fetchTopupTransferCode } from "./topup.api";
export {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCartApi,
  syncCart,
  getCartCount,
} from "./cart.api";

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
export type { VariantFullDataDto } from "./variant.api";
export type { UserReviewDto } from "./user.api";
