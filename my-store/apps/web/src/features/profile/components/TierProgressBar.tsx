// Tier color config (Sliver = typo trong DB, dùng chung style Silver)
export const TIER_COLORS: Record<string, { gradient: string; text: string; bg: string }> = {
  Member:   { gradient: "from-gray-400 to-gray-500",     text: "text-gray-600 dark:text-gray-400",     bg: "bg-gray-100 dark:bg-gray-800" },
  Silver:   { gradient: "from-slate-400 to-slate-500",   text: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800" },
  Sliver:   { gradient: "from-slate-400 to-slate-500",   text: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800" },
  Gold:     { gradient: "from-amber-400 to-yellow-500",  text: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  Platinum: { gradient: "from-cyan-400 to-blue-500",     text: "text-cyan-600 dark:text-cyan-400",     bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  Diamond:  { gradient: "from-purple-400 to-pink-500",   text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

export const DEFAULT_TIERS = [
  { name: "Member", minTotalSpend: 0 },
  { name: "Silver", minTotalSpend: 5000000 },
  { name: "Gold", minTotalSpend: 20000000 },
  { name: "Platinum", minTotalSpend: 50000000 },
  { name: "Diamond", minTotalSpend: 100000000 },
];

export function TierProgressBar({ totalSpend, currentTier, tiers }: {
  totalSpend: number;
  currentTier: string;
  tiers?: Array<{ name: string; minTotalSpend: number }>;
}) {
  const tierList = tiers && tiers.length > 0 ? tiers : DEFAULT_TIERS;

  // Find current tier index
  const currentIdx = tierList.findIndex((t) => t.name === currentTier);
  const isMaxTier = currentIdx >= tierList.length - 1;
  const nextTier = isMaxTier ? null : tierList[currentIdx + 1];

  // Calculate progress
  const currentThreshold = tierList[Math.max(0, currentIdx)]?.minTotalSpend ?? 0;
  const nextThreshold = nextTier?.minTotalSpend ?? currentThreshold;
  const range = nextThreshold - currentThreshold;
  const progress = isMaxTier ? 100 : range > 0 ? Math.min(100, Math.max(0, ((totalSpend - currentThreshold) / range) * 100)) : 0;
  const remaining = isMaxTier ? 0 : Math.max(0, nextThreshold - totalSpend);

  const currentColors = TIER_COLORS[currentTier] || TIER_COLORS.Member;
  const nextColors = nextTier ? (TIER_COLORS[nextTier.name] || TIER_COLORS.Member) : currentColors;

  return (
    <div className="mt-5 pt-4 border-t border-gray-200 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold ${currentColors.text}`}>
          {currentTier}
        </span>
        {nextTier ? (
          <span className={`text-xs font-bold ${nextColors.text}`}>
            {nextTier.name}
          </span>
        ) : (
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            Hạng cao nhất ✨
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${isMaxTier ? currentColors.gradient : nextColors.gradient} transition-all duration-1000 ease-out`}
          style={{ width: `${progress}%` }}
        />
        {/* Shimmer effect */}
        {progress > 0 && progress < 100 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        )}
      </div>

      {/* Info text */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-gray-500 dark:text-slate-400">
          {totalSpend.toLocaleString("vi-VN")}đ
        </span>
        {isMaxTier ? (
          <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
            Đã đạt hạng cao nhất!
          </span>
        ) : (
          <span className="text-[11px] text-gray-500 dark:text-slate-400">
            Còn <span className="font-semibold text-gray-700 dark:text-slate-300">{remaining.toLocaleString("vi-VN")}đ</span> để lên {nextTier?.name}
          </span>
        )}
      </div>
    </div>
  );
}
