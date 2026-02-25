import { authFetch, getApiBase } from "@/lib/api";

/**
 * Gọi API profile (currentCycle từ tier_cycles, balance, ...).
 * Luôn gửi request với credentials: "include" để hỗ trợ cả Bearer token (sessionStorage)
 * và httpOnly cookie (mavryk_at) — không return null khi thiếu token vì cookie vẫn được gửi.
 */
export async function fetchUserProfile() {
  try {
    const res = await authFetch(`${getApiBase()}/api/user/profile`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (import.meta.env?.DEV) console.warn("[Profile] fetchUserProfile: res.ok=false", res.status);
      return null;
    }
    if (import.meta.env?.DEV) {
      console.log("[Profile] fetchUserProfile: currentCycle=", data?.currentCycle ? "present" : "missing", data?.currentCycle ?? "(null)");
    }
    return data;
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Profile] fetchUserProfile error:", e);
    return null;
  }
}
