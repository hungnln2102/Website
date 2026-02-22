import { User, Receipt } from "lucide-react";
import { TierProgressBar } from "./TierProgressBar";

export function AccountOverview({ user, formatDate }: { user: any; formatDate: (date: string | null | undefined) => string }) {
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

          {/* Tier Progress Bar */}
          <TierProgressBar
            totalSpend={user?.totalSpend ?? 0}
            currentTier={user?.customerType || "Member"}
            tiers={user?.tiers}
          />
        </div>
      </div>
    </div>
  );
}
