/**
 * API barrel – re-exports all API modules and types so `import { ... } from "@/lib/api"` works.
 */

export { getAuthToken, AUTH_EXPIRED_EVENT, authFetch } from "./auth";
export { getApiBase, handleApiError } from "./client";

export { fetchProducts } from "./products.api";
export { fetchPromotions } from "./promotions.api";
export { fetchCategories } from "./categories.api";
export { fetchProductPackages } from "./product-packages.api";
export { fetchVariantDetail, fetchProductInfo } from "./variant.api";
export {
  checkPaymentHealth,
  createPayment,
  checkPaymentStatus,
  generateOrderId,
  confirmBalancePayment,
} from "./payment.api";
export { fetchUserOrders } from "./user.api";
export { fetchFormFields } from "./forms.api";
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
  FormFieldDto,
  FormFieldsResponse,
  CartItemDto,
  CartResponse,
  CartAddResponse,
  CartCountResponse,
} from "../types";
