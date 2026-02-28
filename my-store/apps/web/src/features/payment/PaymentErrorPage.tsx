import { useEffect, useState } from "react";
import { XCircle, Home, RefreshCcw, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface PaymentErrorPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const errorMessages: Record<string, string> = {
  payment_failed: "Giao dịch thanh toán không thành công. Vui lòng thử lại.",
  cancelled: "Bạn đã hủy giao dịch thanh toán.",
  timeout: "Giao dịch đã hết thời gian. Vui lòng thử lại.",
  invalid_amount: "Số tiền không hợp lệ. Vui lòng kiểm tra lại.",
  declined: "Giao dịch bị từ chối bởi ngân hàng.",
  missing_signature: "Lỗi xác thực giao dịch. Vui lòng thử lại.",
  invalid_signature: "Chữ ký không hợp lệ. Vui lòng thử lại.",
  callback_failed: "Lỗi xử lý kết quả thanh toán. Vui lòng liên hệ hỗ trợ.",
};

export default function PaymentErrorPage({
  onBack,
  onProductClick,
  searchQuery,
  onSearchChange,
}: PaymentErrorPageProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string>("payment_failed");
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
    setErrorCode(params.get("error") || "payment_failed");
  }, []);

  const errorMessage = errorMessages[errorCode] || errorMessages.payment_failed;

  const handleRetry = () => {
    window.history.pushState({}, "", ROUTES.cart);
    window.location.reload();
  };

  const handleCategoryClick = (catSlug: string) => {
    window.history.pushState({}, "", ROUTES.category(catSlug));
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 to-white dark:from-slate-950 dark:to-slate-900">
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
          {/* Error Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-red-400 opacity-25" />
              <div className="relative rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Thanh toán thất bại
          </h1>

          {/* Error Message */}
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-left text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          </div>

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
            Đừng lo lắng! Tiền của bạn sẽ không bị trừ nếu giao dịch thất bại.
            Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/25"
            >
              <RefreshCcw className="w-5 h-5" />
              Thử lại
            </button>

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl border border-gray-200 dark:border-slate-600 transition-all"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>

          {/* Support Info */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Cần hỗ trợ? Liên hệ{" "}
            <a
              href="mailto:support@mavrykpremium.store"
              className="text-red-600 dark:text-red-400 hover:underline"
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
