"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet,
  Sparkles,
  Gift,
  Zap,
  Crown,
  AlertCircle,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchProducts, fetchCategories, getAuthToken, authFetch } from "@/lib/api";
import { PackageSelector } from "./components/PackageSelector";
import { PaymentStatusPanel } from "./components/PaymentStatusPanel";
import { PaymentQRDisplay } from "./components/PaymentQRDisplay";

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
          <PackageSelector
            packages={TOPUP_PACKAGES}
            selectedPackage={selectedPackage}
            onSelectPackage={handleSelectPackage}
            customAmount={customAmount}
            onCustomAmountChange={handleCustomAmountChange}
            getSelectedAmount={getSelectedAmount}
            getSelectedBonus={getSelectedBonus}
            onProceed={handleProceedToPayment}
            formatCurrency={formatCurrency}
          />
        )}

        {step === "payment" && (
          <div className="space-y-6">
            {topupResult ? (
              <PaymentStatusPanel
                topupResult={topupResult}
                countdown={countdown}
                formatCurrency={formatCurrency}
              />
            ) : (
              <PaymentQRDisplay
                bankConfig={BANK_CONFIG}
                generateQRUrl={generateQRUrl}
                transactionCode={transactionCode}
                getSelectedAmount={getSelectedAmount}
                formatCurrency={formatCurrency}
                handleCopy={handleCopy}
                copiedField={copiedField}
                setShowCancelConfirm={setShowCancelConfirm}
                isTestLoading={isTestLoading}
                handleTestTopup={handleTestTopup}
              />
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
