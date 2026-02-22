import { useRef, useState, useEffect } from "react";
import { LogIn, LogOut, User, ChevronDown, Wallet } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  balance?: number;
}

interface UserMenuProps {
  user?: AuthUser | null;
  onLogout?: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = (path: string) => {
    setIsUserMenuOpen(false);
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">
      {user ? (
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2 py-2 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 min-h-[36px] sm:min-h-[40px] sm:gap-2 sm:px-3"
            aria-label="Menu người dùng"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
              {user.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 max-w-[100px] truncate">
                {user.username}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Số dư: {(user.balance ?? 0).toLocaleString("vi-VN")}đ
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.lastName} {user.firstName}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => navigate("/nap-tien")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <span>Nạp tiền</span>
                </button>
                <button
                  onClick={() => navigate("/tai-khoan")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <User className="h-4 w-4" />
                  Tài khoản của tôi
                </button>
                <button
                  onClick={() => { setIsUserMenuOpen(false); onLogout?.(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 transition-all duration-300 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:bg-blue-900/20 dark:hover:shadow-blue-900/20 active:scale-95 min-h-[36px] sm:min-h-[40px] sm:gap-2 sm:px-4"
          aria-label="Đăng nhập"
        >
          <LogIn className="h-4 w-4 shrink-0 text-gray-600 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110 dark:text-slate-400 dark:group-hover:text-blue-400" />
          <span className="hidden sm:inline text-sm font-semibold tracking-tight text-gray-700 transition-colors duration-300 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400 whitespace-nowrap">
            Đăng nhập
          </span>
        </button>
      )}
      <div className="flex shrink-0" aria-hidden="true">
        <ModeToggle />
      </div>
    </div>
  );
}
