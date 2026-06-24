import { ROUTES } from "@/lib/constants";
import { Wrench, Tv } from "lucide-react";
import {
  isFixAdobeEduPath,
  isNetflixPath,
  isRenewAdobePath,
  normalizePathname,
} from "@/lib/constants/serviceHubRoutes";

/**
 * Menu rút gọn: gom Adobe EDU + Renew Adobe + Fix Ades thành 1 mục "Fix lỗi Adobe".
 * Backend tra `order_user_tracking.system_note` để dispatch flow tương ứng.
 */
const MENU_ITEMS = [
  { id: "fix-adobe", label: "Fix lỗi Adobe", href: ROUTES.fixAdobeEdu, icon: Wrench },
  { id: "netflix", label: "OTP Netflix", href: ROUTES.netflix, icon: Tv },
] as const;

export function ServicesSidebar() {
  const path =
    typeof window !== "undefined" ? normalizePathname(window.location.pathname) : "";
  const fixAdobePath = normalizePathname(ROUTES.fixAdobeEdu);
  const netflixPath = normalizePathname(ROUTES.netflix);

  const isActive = (href: string) => {
    const normalized = normalizePathname(href);
    if (normalized === fixAdobePath) {
      // Cả route Renew Adobe cũ vẫn active button "Fix lỗi Adobe" để user không lạc.
      return isFixAdobeEduPath(path) || isRenewAdobePath(path);
    }
    if (normalized === netflixPath) return isNetflixPath(path);
    return path === normalized;
  };

  const handleNavigate = (href: string) => {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <aside className="w-full flex-shrink-0 lg:w-56">
      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 p-2 lg:block lg:overflow-visible">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.href)}
              className={`flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors lg:w-full lg:min-w-0 lg:flex-none lg:gap-3 lg:px-4 lg:py-3 ${
                active
                  ? "bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-blue-400" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
