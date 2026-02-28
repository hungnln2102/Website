import { useEffect, useState } from "react";
import { XOctagon, Home, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface PaymentCancelPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function PaymentCancelPage({
  onBack,
  onProductClick,
  searchQuery,
  onSearchChange,
}: PaymentCancelPageProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const isScrolled = useScroll();
  const { user, logout } = useAuth();

  // Fetch products and categories for header
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("orderId"));
  }, []);

  const handleReturnToCart = () => {
    window.history.pushState({}, "", ROUTES.cart);
    window.location.reload();
  };

  const handleCategoryClick = (catSlug: string) => {
    window.history.pushState({}, "", ROUTES.category(catSlug));
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white dark:from-slate-950 dark:to-slate-900">
      <SiteHeader
        isScrolled={isScrolled}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onLogoClick={onBack}
        products={allProducts.map((p) => ({
          id: String(p.id),
          name: p.name,
          slug: p.slug,
          image_url: p.image_url,
          base_price: p.base_price ?? 0,
          discount_percentage: p.discount_percentage ?? 0,
        }))}
        categories={categories.map((c: CategoryDto) => ({
          id: String(c.id),
          name: c.name,
          slug: slugify(c.name),
        }))}
        onProductClick={onProductClick}
        onCategoryClick={handleCategoryClick}
        user={user}
        onLogout={logout}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Cancel Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="relative rounded-full bg-amber-100 dark:bg-amber-900/30 p-6">
                <XOctagon className="w-16 h-16 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Đã hủy thanh toán
          </h1>

          {/* Order Info */}
          {orderId && (
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Mã đơn hàng
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                {orderId}
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn vẫn được lưu trong
            giỏ hàng. Bạn có thể quay lại bất cứ lúc nào để hoàn tất thanh toán.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleReturnToCart}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-500/25"
            >
              <ShoppingCart className="w-5 h-5" />
              Quay lại giỏ hàng
            </button>

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl border border-gray-200 dark:border-slate-600 transition-all"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Sản phẩm trong giỏ hàng sẽ được giữ trong 30 phút. Hãy hoàn tất
              thanh toán sớm để không bỏ lỡ ưu đãi!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
