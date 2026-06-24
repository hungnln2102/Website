import { ROUTES } from '@/lib/constants';
import { Wrench, Tv } from 'lucide-react';
import {
  isFixAdobeEduPath,
  isNetflixPath,
  isRenewAdobePath,
  normalizePathname,
} from '@/lib/constants/serviceHubRoutes';

/**
 * Menu rút gọn: gom Adobe EDU + Renew Adobe + Fix Ades thành 1 mục "Fix lỗi Adobe".
 * Backend tra `order_user_tracking.system_note` để dispatch flow tương ứng.
 */
const MENU_ITEMS = [
  { id: 'fix-adobe', label: 'Fix lỗi Adobe', href: ROUTES.fixAdobeEdu, icon: Wrench },
  { id: 'netflix', label: 'OTP Netflix', href: ROUTES.netflix, icon: Tv },
] as const;

export function ServicesSidebar() {
  const path = typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '';
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
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <aside className="w-full flex-shrink-0 lg:flex lg:w-56 lg:flex-col lg:justify-center">
      <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-xl shadow-blue-950/20 backdrop-blur lg:block lg:rounded-xl lg:border-slate-700/80 lg:bg-slate-900/90 lg:shadow-none">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.href)}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-semibold transition-colors sm:text-sm lg:gap-3 lg:rounded-lg lg:px-4 ${
                active
                  ? 'bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
