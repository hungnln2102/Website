import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { AUTH_EXPIRED_EVENT, getApiBase } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
  balance?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface StoredAuthData {
  user: User;
  expiresAt: number; // Timestamp when session expires
}

const AUTH_STORAGE_KEY = "mavryk_auth_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// SECURITY: Use sessionStorage instead of localStorage
// sessionStorage is cleared when browser tab is closed, reducing XSS risk
const storage = typeof window !== 'undefined' ? window.sessionStorage : null;

/**
 * Simple obfuscation for stored data (not encryption, but prevents casual reading)
 * For true security, use httpOnly cookies on the server side
 */
const encodeData = (data: StoredAuthData): string => {
  return btoa(encodeURIComponent(JSON.stringify(data)));
};

const decodeData = (encoded: string): StoredAuthData | null => {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from sessionStorage on mount
  useEffect(() => {
    if (!storage) {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const storedData = storage.getItem(AUTH_STORAGE_KEY);
    if (storedData) {
      try {
        const authData = decodeData(storedData);
        
        // Check if session has expired
        if (authData && authData.expiresAt > Date.now()) {
          setAuthState({
            user: authData.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Session expired - clear storage
          storage.removeItem(AUTH_STORAGE_KEY);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch {
        storage.removeItem(AUTH_STORAGE_KEY);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  // Auto-logout when session expires
  useEffect(() => {
    if (!authState.isAuthenticated || !storage) return;

    const storedData = storage.getItem(AUTH_STORAGE_KEY);
    if (!storedData) return;

    const authData = decodeData(storedData);
    if (!authData) return;

    const timeUntilExpiry = authData.expiresAt - Date.now();
    if (timeUntilExpiry <= 0) {
      logout();
      return;
    }

    // Set timer to auto-logout when session expires
    const timer = setTimeout(() => {
      logout();
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [authState.isAuthenticated]);

  const login = useCallback((user: User) => {
    if (!storage) return;

    const authData: StoredAuthData = {
      user,
      expiresAt: Date.now() + SESSION_DURATION,
    };

    storage.setItem(AUTH_STORAGE_KEY, encodeData(authData));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // Update user data (e.g., after balance change)
  const updateUser = useCallback((updates: Partial<User>) => {
    if (!storage || !authState.user) return;

    const updatedUser = { ...authState.user, ...updates };
    
    // Get current expiry from storage
    const storedData = storage.getItem(AUTH_STORAGE_KEY);
    const currentAuth = storedData ? decodeData(storedData) : null;
    
    const authData: StoredAuthData = {
      user: updatedUser,
      expiresAt: currentAuth?.expiresAt || Date.now() + SESSION_DURATION,
    };

    storage.setItem(AUTH_STORAGE_KEY, encodeData(authData));
    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
  }, [authState.user]);

  const logout = useCallback(async () => {
    // Call server to invalidate tokens
    try {
      const accessToken = storage?.getItem("accessToken");
      const refreshToken = storage?.getItem("refreshToken");
      
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

    // Clear local storage
    if (storage) {
      storage.removeItem(AUTH_STORAGE_KEY);
      storage.removeItem("accessToken");
      storage.removeItem("refreshToken");
    }
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    // Redirect to home page after logout
    window.history.pushState({}, "", ROUTES.home);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  // Listen for session expired event (401 from API)
  useEffect(() => {
    const handleSessionExpired = () => {
      // Clear local storage
      if (storage) {
        storage.removeItem(AUTH_STORAGE_KEY);
        storage.removeItem("accessToken");
        storage.removeItem("refreshToken");
      }
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Show notification and redirect
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      window.history.pushState({}, "", ROUTES.home);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    updateUser,
  };
}
