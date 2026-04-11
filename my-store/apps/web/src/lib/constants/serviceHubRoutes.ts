import { ROUTES } from "./app.config";

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, "");

const FIX_ADOBE_EDU_ALIASES = new Set(["check-profile", "otp"]);

/** Legacy short paths (before `/system/...` canonical URLs). */
const RENEW_ADOBE_ALIASES = new Set(["renew-adobe"]);
const NETFLIX_ALIASES = new Set(["netflix"]);

export const SERVICE_HUB_PATHS = {
  fixAdobeEdu: trimSlashes(ROUTES.fixAdobeEdu),
  otp: trimSlashes(ROUTES.otp),
  renewAdobe: trimSlashes(ROUTES.renewAdobe),
  netflix: trimSlashes(ROUTES.netflix),
} as const;

export function normalizePathname(pathname: string): string {
  return trimSlashes(pathname || "");
}

/** True when `pathname` matches this app route (after slash normalization). */
export function matchesAppRoute(pathname: string, routePath: string): boolean {
  return normalizePathname(pathname) === normalizePathname(routePath);
}

export function isFixAdobeEduPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === SERVICE_HUB_PATHS.fixAdobeEdu ||
    normalized === SERVICE_HUB_PATHS.otp ||
    FIX_ADOBE_EDU_ALIASES.has(normalized)
  );
}

export function isRenewAdobePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return normalized === SERVICE_HUB_PATHS.renewAdobe || RENEW_ADOBE_ALIASES.has(normalized);
}

export function isNetflixPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return normalized === SERVICE_HUB_PATHS.netflix || NETFLIX_ALIASES.has(normalized);
}
