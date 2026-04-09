import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, productsQueryKey } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { ServicesSidebar } from "./ServicesSidebar";
import { Construction } from "lucide-react";

const TITLES: Record<string, { title: string; description: string }> = {
  "renew-adobe": { title: "Renew Adobe", description: "Gia hạn Adobe Creative Cloud" },
  "renew-zoom": { title: "Renew Zoom", description: "Gia hạn Zoom" },
  "netflix": { title: "Netflix", description: "Dịch vụ Netflix" },
};

export default function ServicePlaceholderPage({
  serviceId,
}: {
  serviceId: "renew-adobe" | "renew-zoom" | "netflix";
}) {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const { title, description } = TITLES[serviceId] ?? { title: "Dịch vụ", description: "" };

  const { data: products = [] } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/20 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery=""
          onSearchChange={() => {}}
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
          categories={categories.map((c) => ({
            id: String(c.id),
            name: c.name,
            slug: c.name.toLowerCase().replace(/\s+/g, "-"),
          }))}
          onProductClick={(slug) => {
            window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          onCategoryClick={(slug) => {
            window.history.pushState({}, "", ROUTES.category(slug));
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          user={user}
          onLogout={logout}
        />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl gap-6 px-4 py-10">
        <ServicesSidebar />
        <div className="flex flex-1 min-w-0 items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="mb-5 px-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">{title}</h1>
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-12 text-center">
              <Construction className="mx-auto mb-4 h-16 w-16 text-amber-500/80" />
              <h2 className="text-xl font-semibold text-slate-200">Đang phát triển</h2>
              <p className="mt-2 text-sm text-slate-400">
                Tính năng này đang được xây dựng. Vui lòng quay lại sau.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
