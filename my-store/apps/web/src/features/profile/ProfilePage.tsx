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
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, type CategoryDto, authFetch, getAuthToken } from "@/lib/api";
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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 active:scale-95 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay về trang chủ
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
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

// Account Overview Component
function AccountOverview({ user, formatDate }: { user: any; formatDate: (date: string | null | undefined) => string }) {
  return (
    <div className="p-6">
      {/* Overview Section */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Tổng quan</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block 1: Account Info */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Thông tin tài khoản
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Tên đăng nhập</p>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.username || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Email</p>
              <p className="font-semibold text-gray-900 dark:text-white break-all text-sm">{user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Họ và tên</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Ngày tham gia</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Block 2: Balance & Membership */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Số dư & Tích lũy
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Số dư</p>
              <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {(user?.balance ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Đã tích lũy</p>
              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                {(user?.balance ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Nhóm khách hàng</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Member
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Order History Component
function OrderHistory() {
  const orders: any[] = []; // TODO: Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Lịch sử đơn hàng</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Order items will be rendered here */}
        </div>
      )}
    </div>
  );
}

// Transaction History Component
function TransactionHistory() {
  const transactions: any[] = []; // TODO: Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Lịch sử giao dịch</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Transaction items will be rendered here */}
        </div>
      )}
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Mật khẩu và bảo mật</h2>
      
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            placeholder="Nhập mật khẩu mới"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
          Đổi mật khẩu
        </button>
      </div>
    </div>
  );
}

// My Comments Component
function MyComments() {
  const comments: any[] = []; // TODO: Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bình luận của tôi</h2>
      
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có bình luận nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Comment items will be rendered here */}
        </div>
      )}
    </div>
  );
}

// Favorite Products Component
function FavoriteProducts({ onProductClick }: { onProductClick: (slug: string) => void }) {
  const favorites: any[] = []; // TODO: Fetch from API

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sản phẩm yêu thích</h2>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có sản phẩm yêu thích nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Favorite product cards will be rendered here */}
        </div>
      )}
    </div>
  );
}

// Referral Program Component
function ReferralProgram({ user }: { user: any }) {
  const referralCode = user?.referralCode || "MAVRYK123";
  const referralLink = `https://mavrykpremium.store/ref/${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Giới thiệu bạn bè</h2>
      
      <div className="max-w-lg">
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          Giới thiệu bạn bè đăng ký và mua hàng để nhận hoa hồng. Bạn sẽ được nhận 5% giá trị đơn hàng của người được giới thiệu.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Mã giới thiệu của bạn</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 font-mono text-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={() => copyToClipboard(referralCode)}
                className="px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Sao chép
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Link giới thiệu</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Sao chép
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Thống kê giới thiệu</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Đã giới thiệu</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0đ</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Tổng hoa hồng</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0đ</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Chờ thanh toán</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
