import { useState } from "react";

export function SecuritySettings() {
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
