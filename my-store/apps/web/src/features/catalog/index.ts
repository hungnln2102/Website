// Components
export {
  CatalogLayout,
  PageHeader,
  SortToolbar,
  ProductGrid,
} from "./components";
export type { SortOption } from "./components";

// Hooks
export { useCatalogData, useProductSort } from "./hooks";

// Pages
export { default as AllProductsPage } from "./AllProductsPage";
export { default as NewProductsPage } from "./NewProductsPage";
export { default as PromotionsPage } from "./PromotionsPage";
export { default as CategoryPage } from "./CategoryPage";
