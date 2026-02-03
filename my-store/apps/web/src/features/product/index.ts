// Components
export {
  ProductLoadingSkeleton,
  ProductNotFound,
  ProductImageGallery,
  ProductInfo,
  PackageSelector,
  DurationSelector,
  BuyButton,
  ProductDescription,
  ReviewSection,
  PurchasePolicy,
  RelatedProducts,
} from "./components";
export type { DurationOption } from "./components";

// Hooks
export { useProductData, useProductSelection } from "./hooks";

// Utils
export { formatCurrency, parseDurationToken, isNewPackage } from "./utils";

// Page
export { default as ProductDetailPage } from "./ProductDetailPage";
