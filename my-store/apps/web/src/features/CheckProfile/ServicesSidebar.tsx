import { ROUTES } from "@/lib/constants";
import { GraduationCap, RefreshCw, Video, Tv } from "lucide-react";

const MENU_ITEMS = [
  { id: "fix-adobe-edu", label: "Gói Adobe Edu", href: ROUTES.fixAdobeEdu, icon: GraduationCap },
  { id: "renew-adobe", label: "Renew Adobe", href: ROUTES.renewAdobe, icon: RefreshCw },
  { id: "renew-zoom", label: "Renew Zoom", href: ROUTES.renewZoom, icon: Video },
  { id: "netflix", label: "OTP Netflix", href: ROUTES.netflix, icon: Tv },
] as const;

export function ServicesSidebar() {
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/^\/+|\/+$/g, "") : "";
  const fixAdobePath = ROUTES.fixAdobeEdu.replace(/^\/+|\/+$/g, "");
  const renewAdobePath = ROUTES.renewAdobe.replace(/^\/+|\/+$/g, "");
  const renewZoomPath = ROUTES.renewZoom.replace(/^\/+|\/+$/g, "");
  const netflixPath = ROUTES.netflix.replace(/^\/+|\/+$/g, "");

  const isActive = (href: string) => {
    const normalized = href.replace(/^\/+|\/+$/g, "");
    if (normalized === fixAdobePath)
      return path === fixAdobePath || path === "check-profile" || path === "otp";
    if (normalized === renewAdobePath) return path === renewAdobePath || path === "renew-adobe";
    if (normalized === renewZoomPath) return path === renewZoomPath || path === "renew-zoom";
    if (normalized === netflixPath) return path === netflixPath || path === "netflix";
    return path === normalized;
  };

  const handleNavigate = (href: string) => {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col justify-center">
      <nav className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.href)}
              className={`flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors ${
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
