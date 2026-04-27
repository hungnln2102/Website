import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  AUTH_EXPIRED_EVENT,
  getAuthToken,
  clearClientAuthStorage,
  getSessionAuthStoragePair,
  MAVRYK_AUTH_SESSION_KEY,
} from "@/features/auth/api/auth";
import { getApiBase } from "@/lib/api/client";
import { MSG_SESSION_EXPIRED } from "@/lib/messages/apiUserErrors";
import { ROUTES } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
  balance?: number;
  /** MAVC, MAVL, … — dùng cache/query giá catalog */
  roleCode?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface StoredAuthData {
  user: User;
  expiresAt: number;
}

/** Chuẩn hóa user từ API/storage (id có thể là number). */
function normalizeUser(raw: User | Record<string, unknown>): User {
  const r = raw as Record<string, unknown>;
  const roleCodeRaw = r.roleCode;
  const roleCode =
    typeof roleCodeRaw === "string" && roleCodeRaw.trim()
      ? roleCodeRaw.trim().toUpperCase().slice(0, 4)
      : undefined;
  return {
    id: String(r.id ?? ""),
    email: String(r.email ?? ""),
    username: String(r.username ?? ""),
    firstName: String(r.firstName ?? ""),
    lastName: String(r.lastName ?? ""),
    ...(typeof r.createdAt === "string" ? { createdAt: r.createdAt } : {}),
    ...(typeof r.balance === "number" ? { balance: r.balance } : {}),
    ...(roleCode ? { roleCode } : {}),
  };
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const readRefreshTokenFromStores = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem("refreshToken") ||
    window.localStorage.getItem("refreshToken")
  );
};

const encodeData = (data: StoredAuthData): string => {
  return btoa(encodeURIComponent(JSON.stringify(data)));
};

const decodeData = (encoded: string): StoredAuthData | null => {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as StoredAuthData;
    if (!parsed?.user) return null;
    parsed.user = normalizeUser(parsed.user);
    return parsed;
  } catch {
    return null;
  }
};

function readAuthFromStores(): { data: StoredAuthData; store: Storage } | null {
  if (typeof window === "undefined") return null;
  for (const store of [window.sessionStorage, window.localStorage]) {
    const raw = store.getItem(MAVRYK_AUTH_SESSION_KEY);
    if (!raw) continue;
    const authData = decodeData(raw);
    if (authData && authData.expiresAt > Date.now()) {
      return { data: authData, store };
    }
    store.removeItem(MAVRYK_AUTH_SESSION_KEY);
  }
  return null;
}

export type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** @returns false nếu không ghi được storage (trình duyệt chặn). */
  login: (user: User) => boolean;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const activeAuthStoreRef = useRef<Storage | null>(null);

  useEffect(() => {
    const found = readAuthFromStores();
    if (found) {
      activeAuthStoreRef.current = found.store;
      setAuthState({
        user: found.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      activeAuthStoreRef.current = null;
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const accessToken = getAuthToken();
      const refreshToken = readRefreshTokenFromStores();

      await fetch(`${getApiBase()}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore errors - still proceed with local logout
    }

    clearClientAuthStorage();
    activeAuthStoreRef.current = null;

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    window.history.pushState({}, "", ROUTES.home);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const store = activeAuthStoreRef.current;
    if (!store) return;

    const storedData = store.getItem(MAVRYK_AUTH_SESSION_KEY);
    if (!storedData) return;

    const authData = decodeData(storedData);
    if (!authData) return;

    const timeUntilExpiry = authData.expiresAt - Date.now();
    if (timeUntilExpiry <= 0) {
      void logout();
      return;
    }

    const timer = setTimeout(() => {
      void logout();
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [authState.isAuthenticated, logout]);

  const login = useCallback((user: User): boolean => {
    if (typeof window === "undefined") return false;

    const normalized = normalizeUser(user);
    let store: Storage;
    let other: Storage;
    try {
      ({ primary: store, secondary: other } = getSessionAuthStoragePair());
    } catch {
      return false;
    }

    other.removeItem(MAVRYK_AUTH_SESSION_KEY);
    other.removeItem("accessToken");
    other.removeItem("refreshToken");

    activeAuthStoreRef.current = store;
    const authData: StoredAuthData = {
      user: normalized,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    try {
      store.setItem(MAVRYK_AUTH_SESSION_KEY, encodeData(authData));
    } catch {
      return false;
    }
    setAuthState({
      user: normalized,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    const store = activeAuthStoreRef.current;
    if (!store || !authState.user) return;

    const updatedUser = normalizeUser({ ...authState.user, ...updates });

    const storedData = store.getItem(MAVRYK_AUTH_SESSION_KEY);
    const currentAuth = storedData ? decodeData(storedData) : null;

    const authData: StoredAuthData = {
      user: updatedUser,
      expiresAt: currentAuth?.expiresAt || Date.now() + SESSION_DURATION_MS,
    };

    store.setItem(MAVRYK_AUTH_SESSION_KEY, encodeData(authData));
    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
  }, [authState.user]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearClientAuthStorage();
      activeAuthStoreRef.current = null;

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast.error(MSG_SESSION_EXPIRED);
      window.history.pushState({}, "", ROUTES.home);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const value = useMemo(
    () => ({
      user: authState.user,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      login,
      logout,
      updateUser,
    }),
    [
      authState.user,
      authState.isAuthenticated,
      authState.isLoading,
      login,
      logout,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải dùng bên trong <AuthProvider>");
  }
  return ctx;
}
