"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Wallet,
  Copy,
  Check,
  Sparkles,
  Gift,
  Zap,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchProducts, fetchCategories, getAuthToken, authFetch } from "@/lib/api";

// Bank configuration for VietQR (from env variables)
const BANK_CONFIG = {
  bankId: import.meta.env.VITE_BANK_ID || "970432",
  bankName: import.meta.env.VITE_BANK_NAME || "VPBank",
  accountNo: import.meta.env.VITE_BANK_ACCOUNT_NO || "9183400998",
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "NGO HUNG",
  template: "compact",
};

// Topup packages
const TOPUP_PACKAGES = [
  {
    id: "50k",
    amount: 50000,
    bonus: 0,
    label: "50.000đ",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    popular: false,
  },
  {
    id: "100k",
    amount: 100000,
    bonus: 5000,
    label: "100.000đ",
    bonusLabel: "+5.000đ",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-500",
    popular: false,
  },
  {
    id: "200k",
    amount: 200000,
    bonus: 15000,
    label: "200.000đ",
    bonusLabel: "+15.000đ",
    icon: Gift,
    color: "from-violet-500 to-purple-500",
    popular: true,
  },
  {
    id: "500k",
    amount: 500000,
    bonus: 50000,
    label: "500.000đ",
    bonusLabel: "+50.000đ",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    popular: false,
  },
  {
    id: "1m",
    amount: 1000000,
    bonus: 120000,
    label: "1.000.000đ",
    bonusLabel: "+120.000đ",
    icon: Crown,
    color: "from-rose-500 to-pink-500",
    popular: false,
  },
  {
    id: "custom",
    amount: 0,
    bonus: 0,
    label: "Tùy chọn",
    icon: Wallet,
    color: "from-slate-500 to-slate-600",
    popular: false,
    isCustom: true,
  },
];

// Custom hook for scroll
function useScroll() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return isScrolled;
}

export default function TopupPage() {
  const isScrolled = useScroll();
  const { user, logout, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<"select" | "payment" | "complete">("select");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [topupResult, setTopupResult] = useState<{
    success: boolean;
    newBalance: number;
    totalAmount: number;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Fetch products & categories for header
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Generate transaction code
  useEffect(() => {
    if (user) {
      const code = `NAP${user.id}${Date.now().toString(36).toUpperCase()}`;
      setTransactionCode(code);
    }
  }, [user]);

  // Countdown and redirect after success
  useEffect(() => {
    if (topupResult?.success) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to home
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [topupResult]);

  const handleLogoClick = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Đã sao chép!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const getSelectedAmount = () => {
    if (selectedPackage === "custom") {
      return parseInt(customAmount.replace(/\D/g, "")) || 0;
    }
    const pkg = TOPUP_PACKAGES.find((p) => p.id === selectedPackage);
    return pkg?.amount || 0;
  };

  const getSelectedBonus = () => {
    if (selectedPackage === "custom") {
      const amount = parseInt(customAmount.replace(/\D/g, "")) || 0;
      // 5% bonus for custom amount >= 100k
      if (amount >= 1000000) return Math.floor(amount * 0.12);
      if (amount >= 500000) return Math.floor(amount * 0.1);
      if (amount >= 200000) return Math.floor(amount * 0.075);
      if (amount >= 100000) return Math.floor(amount * 0.05);
      return 0;
    }
    const pkg = TOPUP_PACKAGES.find((p) => p.id === selectedPackage);
    return pkg?.bonus || 0;
  };

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackage(pkgId);
    if (pkgId !== "custom") {
      setCustomAmount("");
    }
  };

  const handleProceedToPayment = () => {
    const amount = getSelectedAmount();
    if (amount < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }
    // Reset result when proceeding to payment
    setTopupResult(null);
    setStep("payment");
  };

  const handleCancelPayment = () => {
    setStep("select");
    setSelectedPackage(null);
    setCustomAmount("");
    // Generate new transaction code
    if (user) {
      setTransactionCode(`NAP${user.id}${Date.now().toString(36).toUpperCase()}`);
    }
    setShowCancelConfirm(false);
  };

  const generateQRUrl = () => {
    const amount = getSelectedAmount();
    const description = encodeURIComponent(transactionCode);
    return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  const handleCustomAmountChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    // Format with thousand separators
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setCustomAmount(formatted);
  };

  // Test topup function
  const handleTestTopup = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setIsTestLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const response = await authFetch(`${API_BASE_URL}/api/topup/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: getSelectedAmount(),
          transactionCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTopupResult({
          success: true,
          newBalance: data.data.newBalance,
          totalAmount: data.data.totalAmount,
        });
        // Update user balance in auth state
        updateUser({ balance: data.data.newBalance });
        toast.success(`Nạp tiền thành công! +${formatCurrency(data.data.totalAmount)}`);
      } else {
        toast.error(data.error || "Nạp tiền thất bại");
      }
    } catch (error) {
      console.error("Topup test error:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setIsTestLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={handleLogoClick}
          products={products.map((p) => ({ id: String(p.id), name: p.name, slug: p.slug, image_url: p.image_url, base_price: p.base_price, discount_percentage: p.discount_percentage }))}
          categories={categories.map((c) => ({ id: String(c.id), name: c.name, slug: c.name.toLowerCase().replace(/\s+/g, "-") }))}
          user={user}
          onLogout={logout}
        />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-white">
              Vui lòng đăng nhập
            </h2>
            <p className="mt-2 text-slate-400">
              Bạn cần đăng nhập để nạp tiền vào tài khoản
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SiteHeader
        isScrolled={isScrolled}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogoClick={handleLogoClick}
        products={products.map((p) => ({ id: String(p.id), name: p.name, slug: p.slug, image_url: p.image_url, base_price: p.base_price, discount_percentage: p.discount_percentage }))}
        categories={categories.map((c) => ({ id: String(c.id), name: c.name, slug: c.name.toLowerCase().replace(/\s+/g, "-") }))}
        user={user}
        onLogout={logout}
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nạp tiền vào tài khoản</h1>
          <p className="mt-2 text-slate-400">
            Số dư hiện tại:{" "}
            <span className="font-semibold text-emerald-400">
              {formatCurrency(user.balance || 0)}
            </span>
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              step === "select"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-slate-700/50 text-slate-400"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-xs font-bold">
              1
            </span>
            <span className="text-sm font-medium">Chọn mệnh giá</span>
          </div>
          <div className="h-px w-8 bg-slate-700" />
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              step === "payment"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-slate-700/50 text-slate-400"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-xs font-bold">
              2
            </span>
            <span className="text-sm font-medium">Thanh toán</span>
          </div>
        </div>

        {step === "select" && (
          <div className="space-y-6">
            {/* Package Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {TOPUP_PACKAGES.map((pkg) => {
                const Icon = pkg.icon;
                const isSelected = selectedPackage === pkg.id;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -right-8 top-3 rotate-45 bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-0.5 text-xs font-bold text-white">
                        HOT
                      </div>
                    )}

                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${pkg.color}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>

                    <div className="text-lg font-bold text-white">{pkg.label}</div>

                    {pkg.bonusLabel && (
                      <div className="mt-1 text-sm font-medium text-emerald-400">
                        {pkg.bonusLabel} bonus
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            {selectedPackage === "custom" && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nhập số tiền muốn nạp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="100.000"
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 pr-12 text-lg font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    đ
                  </span>
                </div>
                {getSelectedBonus() > 0 && (
                  <p className="mt-2 text-sm text-emerald-400">
                    + {formatCurrency(getSelectedBonus())} bonus
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {selectedPackage && getSelectedAmount() > 0 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Số tiền nạp</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(getSelectedAmount())}
                  </span>
                </div>
                {getSelectedBonus() > 0 && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-400">Bonus</span>
                    <span className="font-semibold text-emerald-400">
                      +{formatCurrency(getSelectedBonus())}
                    </span>
                  </div>
                )}
                <div className="mt-3 border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">Tổng nhận được</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {formatCurrency(getSelectedAmount() + getSelectedBonus())}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={!selectedPackage || getSelectedAmount() < 10000}
              className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
                selectedPackage && getSelectedAmount() >= 10000
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                  : "cursor-not-allowed bg-slate-700 text-slate-400"
              }`}
            >
              Tiếp tục thanh toán
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            {topupResult ? (
              /* Success - Only show success message centered */
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-8 text-center">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                  <h3 className="mt-4 text-2xl font-bold text-white">
                    Nạp tiền thành công!
                  </h3>
                  <p className="mt-3 text-slate-300">
                    Đã cộng{" "}
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(topupResult.totalAmount)}
                    </span>{" "}
                    vào tài khoản
                  </p>
                  <p className="mt-2 text-slate-400">
                    Số dư mới:{" "}
                    <span className="font-semibold text-white">
                      {formatCurrency(topupResult.newBalance)}
                    </span>
                  </p>
                  <p className="mt-4 text-sm text-slate-400">
                    Tự động chuyển về trang chủ sau{" "}
                    <span className="font-semibold text-blue-400">{countdown}s</span>
                  </p>
                  <button
                    onClick={() => {
                      window.history.pushState({}, "", "/");
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                    className="mt-6 rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
            ) : (
              /* Pending - Show payment info and QR */
              <>
                {/* Two Column Layout: Bank Info (Left) + QR Code (Right) */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Bank Info - Left */}
                  <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                    <h4 className="font-semibold text-white">Thông tin chuyển khoản</h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
                        <div>
                          <p className="text-xs text-slate-500">Ngân hàng</p>
                          <p className="font-medium text-white">{BANK_CONFIG.bankName}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
                        <div>
                          <p className="text-xs text-slate-500">Số tài khoản</p>
                          <p className="font-medium text-white">{BANK_CONFIG.accountNo}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(BANK_CONFIG.accountNo, "account")}
                          className="rounded-lg bg-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-600"
                        >
                          {copiedField === "account" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
                        <div>
                          <p className="text-xs text-slate-500">Chủ tài khoản</p>
                          <p className="font-medium text-white">{BANK_CONFIG.accountName}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
                        <div>
                          <p className="text-xs text-slate-500">Số tiền</p>
                          <p className="font-medium text-emerald-400">
                            {formatCurrency(getSelectedAmount())}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleCopy(getSelectedAmount().toString(), "amount")
                          }
                          className="rounded-lg bg-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-600"
                        >
                          {copiedField === "amount" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
                        <div>
                          <p className="text-xs text-slate-500">Nội dung chuyển khoản</p>
                          <p className="font-medium text-amber-400">{transactionCode}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(transactionCode, "code")}
                          className="rounded-lg bg-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-600"
                        >
                          {copiedField === "code" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                      <p className="text-xs text-amber-200">
                        <strong>Quan trọng:</strong> Vui lòng nhập đúng nội dung chuyển
                        khoản để hệ thống tự động cộng tiền vào tài khoản của bạn.
                      </p>
                    </div>
                  </div>

                  {/* QR Code - Right */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Quét mã QR để thanh toán
                    </h3>

                    <div className="relative inline-block rounded-2xl bg-white p-4">
                      <img
                        src={generateQRUrl()}
                        alt="QR Code"
                        className="h-52 w-52"
                      />
                      {/* Scan line animation */}
                      <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-lg">
                        <div className="animate-scan absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-75" />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-400">
                      Sử dụng app ngân hàng để quét mã
                    </p>
                  </div>
                </div>

                {/* Waiting Status */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                    <Clock className="h-5 w-5 animate-pulse text-blue-400" />
                    <span className="text-slate-300">
                      Đang chờ thanh toán... Số dư sẽ được cập nhật tự động
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {/* Cancel Button */}
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex-1 rounded-xl border border-slate-600 bg-slate-700 py-3 font-medium text-slate-300 transition-all hover:bg-slate-600"
                    >
                      Hủy
                    </button>

                    {/* Test Button (Development) - Comment out for production deploy */}
                    {/* <button
                      onClick={handleTestTopup}
                      disabled={isTestLoading}
                      className="flex-1 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 py-3 font-medium text-amber-400 transition-all hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {isTestLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Clock className="h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </span>
                      ) : (
                        "🧪 Test nạp tiền"
                      )}
                    </button> */}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Cancel payment confirmation popup */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-slate-900 p-6 shadow-2xl sm:rounded-2xl">
            <h3 className="text-lg font-semibold text-white">
              Hủy giao dịch nạp tiền?
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Nếu bạn hủy, giao dịch nạp tiền hiện tại sẽ bị bỏ qua. Bạn có thể chọn lại mệnh giá và tạo giao dịch mới sau.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                onClick={handleCancelPayment}
                className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 sm:w-auto sm:px-6"
              >
                Xác nhận hủy
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 sm:w-auto sm:px-6"
              >
                Tiếp tục thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for scan animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 4px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
