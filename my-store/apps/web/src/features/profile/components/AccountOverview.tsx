import { User, Receipt } from "lucide-react";
import { TierProgressBar } from "./TierProgressBar";

/** Còn lại = cycle_end_at - now → "x Ngày hh:mm" */
function formatRemaining(cycleEndAt: string, nowDate: Date): string {
  const end = parseCycleDate(cycleEndAt);
  const ms = end.getTime() - nowDate.getTime();
  if (ms <= 0) return "0 Ngày 00:00";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const remainder = ms % (24 * 60 * 60 * 1000);
  const hours = Math.floor(remainder / (60 * 60 * 1000));
  const minutes = Math.floor((remainder % (60 * 60 * 1000)) / (60 * 1000));
  return `${days} Ngày ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Parse ngày từ API: "yyyy-mm-dd hh:mm:ss" (VN) hoặc ISO → Date (coi là giờ local khi không có Z) */
function parseCycleDate(s: string): Date {
  if (!s) return new Date(NaN);
  if (s.includes("T") || s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(s.replace(" ", "T"));
}

/** Chu kỳ chỉ lấy từ API (bảng tier_cycles). Kiểm tra object có cycleStartAt, cycleEndAt (string). */
function isValidApiCycle(c: unknown): c is { cycleStartAt: string; cycleEndAt: string } {
  return (
    c != null &&
    typeof c === "object" &&
    typeof (c as any).cycleStartAt === "string" &&
    typeof (c as any).cycleEndAt === "string"
  );
}

type AccountOverviewProps = {
  user: any;
  formatDate: (date: string | null | undefined) => string;
  /** Chu kỳ từ API profile — luôn ưu tiên để hiển thị đúng từ tier_cycles */
  currentCycleFromApi?: unknown;
  /** Đang load profile: không dùng client fallback (01/01-30/06), tránh flash sai */
  profileLoading?: boolean;
};

export function AccountOverview({ user, formatDate, currentCycleFromApi, profileLoading }: AccountOverviewProps) {
  const nowDate = user?.serverNow ? new Date(user.serverNow) : new Date();
  // Chỉ hiển thị chu kỳ khi có dữ liệu từ API (tier_cycles). Không fallback.
  const hasApiCycle = isValidApiCycle(currentCycleFromApi);
  const hasUserCycle = isValidApiCycle(user?.currentCycle);
  const effectiveCycle =
    hasApiCycle
      ? { cycleStartAt: (currentCycleFromApi as any).cycleStartAt, cycleEndAt: (currentCycleFromApi as any).cycleEndAt }
      : hasUserCycle
        ? { cycleStartAt: user.currentCycle.cycleStartAt, cycleEndAt: user.currentCycle.cycleEndAt }
        : null;
  const cycleLoading = profileLoading && !effectiveCycle;
  const noCycleData = !profileLoading && !effectiveCycle;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Tên đăng nhập</p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.username || "N/A"}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Email</p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.email || "N/A"}</p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-slate-700/50 pt-4 sm:col-span-2 lg:col-span-3 space-y-4">
              {/* Row 1: Họ + Tên */}
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Họ</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize truncate">{user?.firstName || "N/A"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Tên</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize truncate">{user?.lastName || "N/A"}</p>
                </div>
              </div>
              {/* Row 2: Ngày sinh + Ngày tham gia */}
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Ngày sinh</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Ngày tham gia</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{formatDate(user?.createdAt)}</p>
                </div>
              </div>
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
                {(user?.totalSpend ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Bậc Hiện Tại</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {user?.customerType || "Member"}
              </span>
            </div>
          </div>

          {/* Khối tiến trình bậc + chu kỳ + thời gian reset */}
          <div className="mt-4 rounded-lg border border-gray-200 dark:border-slate-600/50 bg-gray-100/80 dark:bg-slate-800/80 p-4">
            {/* Chu kỳ hiện tại: chỉ từ API (bảng tier_cycles), không fallback */}
            <div className="space-y-1.5 pb-3 border-b border-gray-200 dark:border-slate-700/50">
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Chu kỳ hiện tại:{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {cycleLoading
                    ? "Đang tải..."
                    : noCycleData
                      ? "Chưa có dữ liệu chu kỳ"
                      : effectiveCycle
                        ? `${parseCycleDate(effectiveCycle.cycleStartAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })} - ${parseCycleDate(effectiveCycle.cycleEndAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}`
                        : "—"}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Còn lại:{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {cycleLoading || noCycleData || !effectiveCycle ? "—" : formatRemaining(effectiveCycle.cycleEndAt, nowDate)}
                </span>
              </p>
            </div>

            <TierProgressBar
              totalSpend={user?.totalSpend ?? 0}
              currentTier={user?.customerType || "Member"}
              tiers={user?.tiers}
            />
            {(effectiveCycle?.cycleEndAt ?? user?.tierCycleEnd) && (
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-3 pt-2 border-t border-gray-200 dark:border-slate-700/50">
                Reset chu kỳ:{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {formatDate(effectiveCycle?.cycleEndAt ?? user?.tierCycleEnd ?? null)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
