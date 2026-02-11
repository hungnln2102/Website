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

// Order History Component (Lịch sử đơn hàng)
function OrderHistory() {
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await fetchUserOrders();
      if (!res.success || !res.data) return [];
      return res.data;
    },
  });
  const allOrders: UserOrder[] = ordersData ?? [];

  // --- Filters ---
  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterAmountFrom, setFilterAmountFrom] = useState("");
  const [filterAmountTo, setFilterAmountTo] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    orderId: "",
    amountFrom: "",
    amountTo: "",
    dateFrom: "",
    dateTo: "",
  });

  // --- Pagination ---
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Detail modal ---
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getOrderTotal = (order: UserOrder) =>
    order.items.reduce((s, i) => s + (i.price || 0) * (i.quantity ?? 1), 0);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "Đã thanh toán", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
      case "pending":
        return { label: "Chờ xử lý", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
      case "cancelled":
        return { label: "Đã hủy", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
      case "refunded":
        return { label: "Hoàn tiền", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };
      default:
        return { label: status, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatCurrency = (v: number) => `${v.toLocaleString("vi-VN")}đ`;

  // Apply filters
  const handleFilter = () => {
    setAppliedFilters({
      orderId: filterOrderId.trim(),
      amountFrom: filterAmountFrom.trim(),
      amountTo: filterAmountTo.trim(),
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterOrderId("");
    setFilterAmountFrom("");
    setFilterAmountTo("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedFilters({ orderId: "", amountFrom: "", amountTo: "", dateFrom: "", dateTo: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");

  // Filtered orders
  const filteredOrders = allOrders.filter((order) => {
    if (appliedFilters.orderId && !order.id_order.toLowerCase().includes(appliedFilters.orderId.toLowerCase())) return false;
    const total = getOrderTotal(order);
    if (appliedFilters.amountFrom && total < Number(appliedFilters.amountFrom)) return false;
    if (appliedFilters.amountTo && total > Number(appliedFilters.amountTo)) return false;
    if (appliedFilters.dateFrom) {
      const from = new Date(appliedFilters.dateFrom);
      if (new Date(order.order_date) < from) return false;
    }
    if (appliedFilters.dateTo) {
      const to = new Date(appliedFilters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(order.order_date) > to) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử đơn hàng</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Hiển thị thông tin các sản phẩm bạn đã mua tại Mavryk Premium Store
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Mã đơn hàng */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Mã đơn hàng</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={filterOrderId}
                onChange={(e) => setFilterOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                placeholder="Nhập mã đơn..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
              />
            </div>
          </div>

          {/* Số tiền từ */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Số tiền từ</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterAmountFrom}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) setFilterAmountFrom(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
            />
          </div>

          {/* Số tiền đến */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Số tiền đến</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterAmountTo}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) setFilterAmountTo(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="10,000,000"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
            />
          </div>

          {/* Từ ngày */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Từ ngày</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:[color-scheme:dark]"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Đến ngày</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:[color-scheme:dark]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleFilter}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Filter className="h-4 w-4" />
              Lọc
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                title="Xóa bộ lọc"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results summary */}
      {!isLoading && !error && (
        <div className="mb-3 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
          <span>
            {hasActiveFilters
              ? `Tìm thấy ${filteredOrders.length} đơn hàng`
              : `Tổng cộng ${allOrders.length} đơn hàng`}
          </span>
          {filteredOrders.length > ITEMS_PER_PAGE && (
            <span>
              Trang {currentPage}/{totalPages}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="text-gray-500 dark:text-slate-400">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400">Không thể tải đơn hàng. Vui lòng thử lại.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-slate-600" />
          <p className="font-medium text-gray-500 dark:text-slate-400">
            {hasActiveFilters ? "Không tìm thấy đơn hàng phù hợp" : "Bạn chưa có đơn hàng nào"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300">Thời gian</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300">Mã đơn hàng</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300">Sản phẩm</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 dark:text-slate-300">Tổng tiền</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-gray-600 dark:text-slate-300">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-gray-600 dark:text-slate-300 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {paginatedOrders.map((order) => {
                  const total = getOrderTotal(order);
                  const status = getStatusInfo(order.status);
                  const productNames = order.items.map((i) => i.name || i.id_product).join(", ");
                  return (
                    <tr
                      key={order.id_order}
                      className="bg-white transition-colors hover:bg-blue-50/30 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 dark:text-slate-400">
                        {formatDateTime(order.order_date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">{order.id_order}</span>
                          <button
                            onClick={() => copyOrderId(order.id_order)}
                            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                            title="Sao chép mã"
                          >
                            {copiedId === order.id_order ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="max-w-[250px] px-4 py-3.5">
                        <p className="truncate text-gray-700 dark:text-slate-300" title={productNames}>
                          {productNames}
                        </p>
                        {order.items.length > 1 && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {order.items.length} sản phẩm
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {paginatedOrders.map((order) => {
              const total = getOrderTotal(order);
              const status = getStatusInfo(order.status);
              return (
                <div
                  key={order.id_order}
                  onClick={() => setSelectedOrder(order)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.id_order}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(order.order_date)}
                  </div>
                  <div className="mb-3 flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-slate-500" />
                    <span className="line-clamp-2">
                      {order.items.map((i) => i.name || i.id_product).join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-slate-700">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{order.items.length} sản phẩm</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400 dark:text-slate-500">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
                        currentPage === p
                          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-x-4 top-1/2 z-[101] max-h-[85vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 dark:border-slate-700 dark:bg-slate-900">
            {/* Modal header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết đơn hàng</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order info */}
            <div className="mb-5 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Mã đơn hàng</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedOrder.id_order}</span>
                  <button
                    onClick={() => copyOrderId(selectedOrder.id_order)}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {copiedId === selectedOrder.id_order ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Thời gian</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateTime(selectedOrder.order_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Trạng thái</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusInfo(selectedOrder.status).cls}`}>
                  {getStatusInfo(selectedOrder.status).label}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-5">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-300">
                Sản phẩm ({selectedOrder.items.length})
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {item.name || item.id_product}
                      </p>
                      {item.quantity != null && item.quantity > 1 && (
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Số lượng: {item.quantity} × {formatCurrency(item.unitPrice || item.price)}
                        </p>
                      )}
                    </div>
                    <span className="ml-4 shrink-0 font-semibold text-gray-900 dark:text-white">
                      {formatCurrency((item.price || 0) * (item.quantity ?? 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <span className="font-semibold text-gray-700 dark:text-slate-300">Tổng cộng</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(getOrderTotal(selectedOrder))}
              </span>
            </div>
          </div>
        </>
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
