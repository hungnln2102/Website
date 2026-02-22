export function ReferralProgram({ user }: { user: any }) {
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
