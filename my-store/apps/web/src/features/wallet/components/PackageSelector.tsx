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
  proceedLoading?: boolean;
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
  proceedLoading = false,
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
              {(pkg.popular || (pkg.promotionPercent != null && pkg.promotionPercent > 0)) && (
                <div className="absolute -right-8 top-3 rotate-45 bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-0.5 text-xs font-bold text-white">
                  {pkg.promotionPercent != null && pkg.promotionPercent > 0
                    ? `${pkg.promotionPercent}%`
                    : "HOT"}
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
            </button>
          );
        })}
      </div>

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
        disabled={!selectedPackage || getSelectedAmount() < 10000 || proceedLoading}
        className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
          selectedPackage && getSelectedAmount() >= 10000 && !proceedLoading
            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            : "cursor-not-allowed bg-slate-700 text-slate-400"
        }`}
      >
        {proceedLoading ? "Đang tạo mã chuyển khoản..." : "Tiếp tục thanh toán"}
      </button>
    </div>
  );
}
