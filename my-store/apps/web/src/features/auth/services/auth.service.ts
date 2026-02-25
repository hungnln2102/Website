import type { FieldErrors, RegisterFormData } from "../components/RegisterForm";
import { getApiBase } from "@/lib/api";
import { fetchWithTimeoutAndRetry } from "@/lib/utils/fetchWithRetry";

/** Check if CAPTCHA is required */
export const checkCaptchaRequired = async (): Promise<{
  required: boolean;
  siteKey?: string;
}> => {
  try {
    const response = await fetchWithTimeoutAndRetry(
      `${getApiBase()}/api/auth/captcha-required`,
      { credentials: "include" },
      { timeoutMs: 10000, retries: 1 }
    );
    if (!response.ok) return { required: false };
    return await response.json();
  } catch {
    return { required: false };
  }
};

/** Check if username or email already exists in database */
export const checkExistingUser = async (
  username: string,
  email: string
): Promise<FieldErrors> => {
  try {
    const response = await fetchWithTimeoutAndRetry(
      `${getApiBase()}/api/auth/check-user`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email }),
      },
      { timeoutMs: 10000, retries: 1 }
    );

    if (!response.ok) throw new Error("API error");

    return await response.json();
  } catch (error) {
    if (import.meta.env.DEV) console.error("Check user error:", error);
    // Return empty errors on API failure to allow form submission attempt
    return {};
  }
};

/** Register new user in database */
export const registerUser = async (
  data: RegisterFormData
): Promise<{ success: boolean; error?: string; field?: string }> => {
  try {
    const response = await fetchWithTimeoutAndRetry(
      `${getApiBase()}/api/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth || undefined,
        }),
      },
      { timeoutMs: 15000, retries: 2 }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Đăng ký thất bại",
        field: result.field,
      };
    }

    return { success: true };
  } catch (error) {
    if (import.meta.env.DEV) console.error("Register error:", error);
    return { success: false, error: "Không thể kết nối đến server" };
  }
};

/** Login user — returns tokens and user data */
export const loginUser = async (data: {
  usernameOrEmail: string;
  password: string;
  captchaToken?: string;
}): Promise<{
  ok: boolean;
  requireCaptcha?: boolean;
  siteKey?: string;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  useHttpOnlyCookie?: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}> => {
  try {
    const response = await fetchWithTimeoutAndRetry(
      `${getApiBase()}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      },
      { timeoutMs: 15000, retries: 2 }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        requireCaptcha: result.requireCaptcha,
        siteKey: result.siteKey,
        error: result.error || "Đăng nhập thất bại!",
      };
    }

    return {
      ok: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      useHttpOnlyCookie: result.useHttpOnlyCookie,
      user: result.user,
    };
  } catch {
    return { ok: false, error: "Không thể kết nối đến server!" };
  }
};
