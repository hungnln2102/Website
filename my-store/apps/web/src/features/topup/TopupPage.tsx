"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet, AlertCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchProducts, fetchCategories, getAuthToken, authFetch, getApiBase } from "@/lib/api";
import { useScroll } from "@/hooks/useScroll";
import { BANK_CONFIG, TOPUP_PACKAGES } from "./constants";
import { formatTopupCurrency, getSelectedAmount, getSelectedBonus, formatCustomAmountInput } from "./utils";
import { PackageSelector } from "./components/PackageSelector";
import { PaymentStatusPanel } from "./components/PaymentStatusPanel";
import { PaymentQRDisplay } from "./components/PaymentQRDisplay";

export default function TopupPage() {
  const isScrolled = useScroll();
  const { user, logout, updateUser, isAuthenticated } = useAuth();
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

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  useEffect(() => {
    if (user) {
      setTransactionCode(`NAP${user.id}${Date.now().toString(36).toUpperCase()}`);
    }
  }, [user]);

  useEffect(() => {
    if (!topupResult?.success) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.history.pushState({}, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
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

  const getAmount = () => getSelectedAmount(selectedPackage, customAmount);
  const getBonus = () => getSelectedBonus(selectedPackage, customAmount);

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackage(pkgId);
    if (pkgId !== "custom") setCustomAmount("");
  };

  const handleProceedToPayment = () => {
    if (getAmount() < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }
    setTopupResult(null);
    setStep("payment");
  };

  const handleCancelPayment = () => {
    setStep("select");
    setSelectedPackage(null);
    setCustomAmount("");
    if (user) {
      setTransactionCode(`NAP${user.id}${Date.now().toString(36).toUpperCase()}`);
    }
    setShowCancelConfirm(false);
  };

  const generateQRUrl = () => {
    const amount = getAmount();
    const description = encodeURIComponent(transactionCode);
    return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
  };

  const handleCustomAmountChange = (value: string) => setCustomAmount(formatCustomAmountInput(value));

  const handleTestTopup = async () => {
    const token = getAuthToken();
    if (!token && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    setIsTestLoading(true);
    try {
      const response = await authFetch(`${getApiBase()}/api/topup/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: getAmount(), transactionCode }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTopupResult({
          success: true,
          newBalance: data.data.newBalance,
          totalAmount: data.data.totalAmount,
        });
        updateUser({ balance: data.data.newBalance });
        toast.success(`Nạp tiền thành công! +${formatTopupCurrency(data.data.totalAmount)}`);
      } else {
        toast.error(data.error || "Nạp tiền thất bại");
      }
    } catch (err) {
      console.error("Topup test error:", err);
      toast.error("Lỗi kết nối server");
    } finally {
      setIsTestLoading(false);
    }
  };

  const headerProps = {
    isScrolled,
    searchQuery,
    onSearchChange: setSearchQuery,
    onLogoClick: handleLogoClick,
    products: products.map((p) => ({
      id: String(p.id),
      name: p.name,
      slug: p.slug,
      image_url: p.image_url,
      base_price: p.base_price,
      discount_percentage: p.discount_percentage,
    })),
    categories: categories.map((c) => ({
      id: String(c.id),
      name: c.name,
      slug: c.name.toLowerCase().replace(/\s+/g, "-"),
    })),
    user,
    onLogout: logout,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <SiteHeader {...headerProps} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-white">Vui lòng đăng nhập</h2>
            <p className="mt-2 text-slate-400">Bạn cần đăng nhập để nạp tiền vào tài khoản</p>
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
      <SiteHeader {...headerProps} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nạp tiền vào tài khoản</h1>
          <p className="mt-2 text-slate-400">
            Số dư hiện tại: <span className="font-semibold text-emerald-400">{formatTopupCurrency(user.balance || 0)}</span>
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              step === "select" ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-xs font-bold">1</span>
            <span className="text-sm font-medium">Chọn mệnh giá</span>
          </div>
          <div className="h-px w-8 bg-slate-700" />
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              step === "payment" ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-xs font-bold">2</span>
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
            getSelectedAmount={getAmount}
            getSelectedBonus={getBonus}
            onProceed={handleProceedToPayment}
            formatCurrency={formatTopupCurrency}
          />
        )}

        {step === "payment" && (
          <div className="space-y-6">
            {topupResult ? (
              <PaymentStatusPanel
                topupResult={topupResult}
                countdown={countdown}
                formatCurrency={formatTopupCurrency}
              />
            ) : (
              <PaymentQRDisplay
                bankConfig={BANK_CONFIG}
                generateQRUrl={generateQRUrl}
                transactionCode={transactionCode}
                getSelectedAmount={getAmount}
                formatCurrency={formatTopupCurrency}
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

      {showCancelConfirm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-slate-900 p-6 shadow-2xl sm:rounded-2xl">
            <h3 className="text-lg font-semibold text-white">Hủy giao dịch nạp tiền?</h3>
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

      <style>{`
        @keyframes scan { 0%, 100% { top: 0; } 50% { top: calc(100% - 4px); } }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
