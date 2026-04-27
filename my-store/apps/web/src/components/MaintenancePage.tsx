import { Settings } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-5">
            <Settings className="h-14 w-14 animate-[spin_4s_linear_infinite] text-amber-400" />
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-white">
          Website đang bảo trì
        </h1>

        <p className="mb-8 text-lg text-slate-300">
          Chúng tôi đang nâng cấp hệ thống để phục vụ bạn tốt hơn.
          <br />
          Vui lòng quay lại sau ít phút.
          <br />
          Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua 
          <br />
          <a href="http://t.me/hung_culi">Telegram: @hung_culi</a>
          <br />
          <a href="https://www.facebook.com/mavrykpremium">Fanpage: Mavryk - Tài Khoản Premium </a>
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Tải lại trang
        </button>
      </div>
    </div>
  );
}
