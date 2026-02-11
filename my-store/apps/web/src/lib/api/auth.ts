/**
 * Auth client: token storage and authenticated fetch wrapper.
 */

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("accessToken");
}

export const AUTH_EXPIRED_EVENT = "auth:session-expired";

function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("accessToken");
    window.sessionStorage.removeItem("refreshToken");
    window.sessionStorage.removeItem("auth_data");
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

/**
 * Authenticated fetch wrapper – adds Bearer token and handles 401 by dispatching logout event.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
  if (response.status === 401) {
    handleUnauthorized();
  }
  return response;
}
