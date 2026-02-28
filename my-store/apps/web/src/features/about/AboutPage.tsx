import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, type CategoryDto } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export default function AboutPage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const handleLogoClick = () => {
    window.history.pushState({}, "", ROUTES.home);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleProductClick = (slug: string) => {
    window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleCategoryClick = (slug: string) => {
    window.history.pushState({}, "", ROUTES.category(slug));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/5 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={handleLogoClick}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={products.map((p) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories as CategoryDto[]}
          onProductClick={handleProductClick}
          onCategoryClick={handleCategoryClick}
          user={user}
          onLogout={logout}
        />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12 lg:py-16">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Giới thiệu về Mavryk Premium Store
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Mavryk Premium Store là nền tảng chuyên cung cấp key và tài khoản bản quyền cho các phần mềm
            phục vụ học tập, làm việc và kinh doanh với mức giá hợp lý, giao dịch nhanh chóng và hỗ trợ tận tâm.
          </p>
        </header>

        <section className="space-y-6 rounded-2xl border border-blue-100 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-200 sm:p-6">
          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              Sứ mệnh của chúng tôi
            </h2>
            <p>
              Nhiều người dùng cá nhân và doanh nghiệp nhỏ vẫn đang gặp khó khăn khi tìm mua phần mềm bản
              quyền với chi phí hợp lý và quy trình mua bán minh bạch. Mavryk Premium Store được tạo ra để
              giúp bạn tiếp cận các sản phẩm chính hãng một cách đơn giản: chọn gói phù hợp, thanh toán an
              toàn và nhận hướng dẫn kích hoạt chi tiết chỉ trong vài phút.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              Sản phẩm và dịch vụ
            </h2>
            <p className="mb-2">
              Hệ thống hiện hỗ trợ nhiều phần mềm phổ biến như Microsoft Windows, Office, Visio, Project,
              các gói Adobe, Autodesk cùng nhiều công cụ làm việc khác. Mỗi sản phẩm đều được mô tả rõ ràng
              về loại key, thời hạn sử dụng, cách kích hoạt và chính sách hỗ trợ để bạn dễ dàng chọn lựa.
            </p>
            <p>
              Bên cạnh đó, Mavryk Premium Store liên tục cập nhật các chương trình khuyến mãi, combo ưu đãi
              và các gói bản quyền dành riêng cho học sinh, sinh viên hoặc doanh nghiệp nhỏ nhằm tối ưu chi
              phí nhưng vẫn đảm bảo tính hợp pháp của phần mềm.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              Cam kết hỗ trợ & bảo hành
            </h2>
            <p className="mb-2">
              Sau khi hoàn tất đơn hàng, bạn sẽ nhận được thông tin key hoặc tài khoản kèm hướng dẫn chi tiết
              qua email và trong lịch sử đơn hàng trên hệ thống. Nếu gặp bất kỳ lỗi kích hoạt nào, đội ngũ hỗ
              trợ sẽ kiểm tra và xử lý nhanh nhất có thể trong khung giờ từ 8:00 đến 23:00 hằng ngày.
            </p>
            <p>
              Chúng tôi luôn ưu tiên trải nghiệm lâu dài của khách hàng thay vì chỉ một giao dịch đơn lẻ, vì
              vậy các trường hợp phát sinh hiếm gặp như key bị khóa hoặc tài khoản có vấn đề sẽ được hỗ trợ
              đổi hoặc hoàn tiền theo chính sách hiện hành.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              Bảo mật & an toàn giao dịch
            </h2>
            <p>
              Website được triển khai trên hạ tầng bảo mật với chứng chỉ SSL, bật HSTS và tối ưu hiệu năng
              để quá trình truy cập và thanh toán luôn mượt mà. Dữ liệu quan trọng được mã hóa và chỉ sử
              dụng cho việc xử lý đơn hàng, không chia sẻ cho bên thứ ba ngoài phạm vi cần thiết. Chúng tôi
              cũng thường xuyên rà soát lỗ hổng và cải thiện giao diện để bạn có thể sử dụng trên nhiều thiết
              bị một cách thuận tiện.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

