import { useEffect, useState } from "react";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";

interface PaymentSuccessPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function PaymentSuccessPage({
  onBack,
  onProductClick,
  searchQuery,
  onSearchChange,
}: PaymentSuccessPageProps) {
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
    // Get orderId from URL params
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("orderId"));
  }, []);

  const handleCategoryClick = (catSlug: string) => {
    window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(catSlug)}`);
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white dark:from-slate-950 dark:to-slate-900">
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
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-25" />
              <div className="relative rounded-full bg-green-100 dark:bg-green-900/30 p-6">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Thanh toán thành công!
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
            Cảm ơn bạn đã mua hàng! Đơn hàng của bạn đã được xác nhận và đang
            được xử lý. Bạn sẽ nhận được email xác nhận trong vài phút.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/25"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>

            <button
              onClick={() => onProductClick("tat-ca-san-pham")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl border border-gray-200 dark:border-slate-600 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Tiếp tục mua sắm
            </button>
          </div>

          {/* Support Info */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Nếu có thắc mắc, vui lòng liên hệ{" "}
            <a
              href="mailto:support@mavrykpremium.store"
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              support@mavrykpremium.store
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
