"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { AccountOverview } from "./components/AccountOverview";
import { OrderHistory } from "./components/order-history";
import { TransactionHistory } from "./components/TransactionHistory";
import { SecuritySettings } from "./components/SecuritySettings";
import { MyComments } from "./components/MyComments";
import { PromoCodeSection } from "./components/PromoCodeSection";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, productsQueryKey, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { PROFILE_TABS, type ProfileTabId } from "./config/tabs";
import { fetchUserProfile } from "./api/fetchProfile";

function readProfileTabFromLocation(): ProfileTabId {
  if (typeof window === "undefined") return "account";
  const raw = new URLSearchParams(window.location.search).get("tab");
  if (raw && PROFILE_TABS.some((t) => t.id === raw)) {
    return raw as ProfileTabId;
  }
  return "account";
}

function profileUrlForTab(tabId: ProfileTabId): string {
  return tabId === "account" ? ROUTES.profile : `${ROUTES.profile}?tab=${encodeURIComponent(tabId)}`;
}

interface ProfilePageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}


export default function ProfilePage({
  onBack,
  onProductClick,
  searchQuery = "",
  onSearchChange = () => {},
}: ProfilePageProps) {
  const isScrolled = useScroll();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTabId>(() => readProfileTabFromLocation());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectTab = useCallback((id: ProfileTabId) => {
    setActiveTab(id);
    const href = profileUrlForTab(id);
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) {
      window.history.replaceState({}, "", href);
    }
  }, []);

  useEffect(() => {
    const onPop = () => setActiveTab(readProfileTabFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Fetch products and categories for header
  const { data: allProducts = [] } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Fetch full profile from API (currentCycle, balance, ...); luôn lấy mới để chu kỳ đúng từ tier_cycles
  const { data: profileData, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    enabled: !!user,
    staleTime: 0, // Luôn coi là stale → refetch khi cần, tránh cache cũ (chu kỳ 30/06)
    refetchOnMount: "always",
  });

  // Sync profile data from API to auth state (for header display)
  useEffect(() => {
    if (profileData) {
      const updates: Record<string, unknown> = {};
      if (profileData.balance !== undefined && profileData.balance !== user?.balance) {
        updates.balance = profileData.balance;
      }
      if (profileData.createdAt && profileData.createdAt !== user?.createdAt) {
        updates.createdAt = profileData.createdAt;
      }
      if (profileData.username && profileData.username !== user?.username) {
        updates.username = profileData.username;
      }
      if (profileData.email && profileData.email !== user?.email) {
        updates.email = profileData.email;
      }
      if (profileData.firstName != null && profileData.firstName !== user?.firstName) {
        updates.firstName = profileData.firstName;
      }
      if (profileData.lastName != null && profileData.lastName !== user?.lastName) {
        updates.lastName = profileData.lastName;
      }
      if (Object.keys(updates).length > 0) {
        updateUser(updates as Parameters<typeof updateUser>[0]);
      }
    }
  }, [
    profileData,
    user?.balance,
    user?.createdAt,
    user?.username,
    user?.email,
    user?.firstName,
    user?.lastName,
    updateUser,
  ]);

  const handleCategoryClick = (catSlug: string) => {
    window.history.pushState({}, "", ROUTES.category(catSlug));
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

  // Merge user data with profile data from API; luôn ưu tiên currentCycle từ API để chu kỳ hiển thị đúng
  const fullUserData = profileData
    ? { ...user, ...profileData, currentCycle: profileData.currentCycle ?? user?.currentCycle }
    : user;

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <AccountOverview
            user={fullUserData}
            formatDate={formatDate}
            currentCycleFromApi={profileData?.currentCycle}
            profileLoading={isLoadingProfile}
            refetchProfile={refetchProfile}
          />
        );
      case "orders":
        return <OrderHistory />;
      case "transactions":
        return <TransactionHistory />;
      case "security":
        return <SecuritySettings />;
      case "comments":
        return <MyComments />;
      case "promo":
        return <PromoCodeSection />;
      default:
        return null;
    }
  };

  const activeTabData = PROFILE_TABS.find((t) => t.id === activeTab);

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
                {PROFILE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => selectTab(tab.id)}
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
                {PROFILE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        selectTab(tab.id);
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


