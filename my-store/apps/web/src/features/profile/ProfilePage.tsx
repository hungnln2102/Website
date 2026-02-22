"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  ShoppingBag,
  Receipt,
  Shield,
  MessageSquare,
  Heart,
  Share2,
  ArrowLeft,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Check,
  X,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { AccountOverview } from "./components/AccountOverview";
import { OrderHistory } from "./components/OrderHistory";
import { TransactionHistory } from "./components/TransactionHistory";
import { SecuritySettings } from "./components/SecuritySettings";
import { MyComments } from "./components/MyComments";
import { FavoriteProducts } from "./components/FavoriteProducts";
import { ReferralProgram } from "./components/ReferralProgram";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, fetchUserOrders, type CategoryDto, type UserOrder, authFetch, getAuthToken } from "@/lib/api";
import { slugify } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Fetch user profile from API (uses authFetch for auto-logout on 401)
async function fetchUserProfile() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await authFetch(`${API_BASE}/api/user/profile`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface ProfilePageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

type ProfileTab = "account" | "orders" | "transactions" | "security" | "comments" | "favorites" | "referral";

const tabs = [
  { id: "account" as const, label: "Tài khoản", icon: User },
  { id: "orders" as const, label: "Lịch sử đơn hàng", icon: ShoppingBag },
  { id: "transactions" as const, label: "Lịch sử giao dịch", icon: Receipt },
  { id: "security" as const, label: "Mật khẩu và bảo mật", icon: Shield },
  { id: "comments" as const, label: "Bình luận của tôi", icon: MessageSquare },
  { id: "favorites" as const, label: "Sản phẩm yêu thích", icon: Heart },
  { id: "referral" as const, label: "Giới thiệu bạn bè", icon: Share2 },
];

export default function ProfilePage({
  onBack,
  onProductClick,
  searchQuery = "",
  onSearchChange = () => {},
}: ProfilePageProps) {
  const isScrolled = useScroll();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch products and categories for header
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Fetch full profile with createdAt from API
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 30000, // Cache for 30 seconds
  });

  // Sync profile data from API to auth state (for header display)
  useEffect(() => {
    if (profileData) {
      const updates: Record<string, any> = {};
      if (profileData.balance !== undefined && profileData.balance !== user?.balance) {
        updates.balance = profileData.balance;
      }
      if (profileData.createdAt && profileData.createdAt !== user?.createdAt) {
        updates.createdAt = profileData.createdAt;
      }
      if (Object.keys(updates).length > 0) {
        updateUser(updates);
      }
    }
  }, [profileData, user?.balance, user?.createdAt, updateUser]);

  const handleCategoryClick = (catSlug: string) => {
    window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(catSlug)}`);
    window.dispatchEvent(new Event("popstate"));
  };

  // Format date as dd/mm/yyyy hh:mm:ss
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Merge user data with profile data from API (API has createdAt)
  const fullUserData = profileData ? { ...user, ...profileData } : user;

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountOverview user={fullUserData} formatDate={formatDate} />;
      case "orders":
        return <OrderHistory />;
      case "transactions":
        return <TransactionHistory />;
      case "security":
        return <SecuritySettings />;
      case "comments":
        return <MyComments />;
      case "favorites":
        return <FavoriteProducts onProductClick={onProductClick} />;
      case "referral":
        return <ReferralProgram user={user} />;
      default:
        return null;
    }
  };

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Site Header */}
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
        user={fullUserData}
        onLogout={logout}
      />

      {/* Back Navigation */}
      <div className="border-b border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-[1440px] w-full px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 active:scale-95 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về trang chủ
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`} />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                {activeTabData && <activeTabData.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                <span className="font-medium text-gray-900 dark:text-white">{activeTabData?.label}</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {mobileMenuOpen && (
              <div className="mt-2 rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`} />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


