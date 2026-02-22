import { CheckCircle2 } from "lucide-react";

interface PackageSelectorProps {
  packages: Array<{
    id: string;
    amount: number;
    bonus: number;
    label: string;
    bonusLabel?: string;
    icon: any; // Lucide icon
    color: string;
    popular: boolean;
    isCustom?: boolean;
  }>;
  selectedPackage: string | null;
  onSelectPackage: (pkgId: string) => void;
  customAmount: string;
  onCustomAmountChange: (value: string) => void;
  getSelectedAmount: () => number;
  getSelectedBonus: () => number;
  onProceed: () => void;
  formatCurrency: (amount: number) => string;
}

export function PackageSelector({
  packages,
  selectedPackage,
  onSelectPackage,
  customAmount,
  onCustomAmountChange,
  getSelectedAmount,
  getSelectedBonus,
  onProceed,
  formatCurrency,
}: PackageSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Package Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage === pkg.id;

          return (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg.id)}
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
              onChange={(e) => onCustomAmountChange(e.target.value)}
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
        onClick={onProceed}
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
  );
}
