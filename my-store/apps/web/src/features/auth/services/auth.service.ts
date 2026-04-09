import type { FieldErrors, RegisterFormData } from "../components/RegisterForm";
import { ensureCsrfToken } from "../api/auth";
import { getApiBase } from "@/lib/api";
import { fetchWithTimeoutAndRetry } from "@/lib/utils/fetchWithRetry";

const POST_JSON_OPTS = { timeoutMs: 15000, retries: 1 } as const;

async function jsonPostHeaders(forceRefreshCsrf = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = await ensureCsrfToken(forceRefreshCsrf);
  if (csrf) headers["x-csrf-token"] = csrf;
  return headers;
}

function isCsrfExpiredError(status: number, body: unknown): boolean {
  if (status !== 403) return false;
  const code = (body as { code?: string })?.code;
  return typeof code === "string" && code.startsWith("CSRF_");
}

/**
 * POST JSON + CSRF; nếu cookie CSRF còn nhưng Redis hết hạn → GET csrf-token lại và thử một lần.
 */
async function postJsonWithCsrfRetry(url: string, body: Record<string, unknown>): Promise<Response> {
  const serialized = JSON.stringify(body);
  let headers = await jsonPostHeaders(false);
  let res = await fetchWithTimeoutAndRetry(
    url,
    { method: "POST", headers, credentials: "include", body: serialized },
    POST_JSON_OPTS
  );
  const probe = await res
    .clone()
    .json()
    .catch(() => ({}));
  if (isCsrfExpiredError(res.status, probe)) {
    headers = await jsonPostHeaders(true);
    res = await fetchWithTimeoutAndRetry(
      url,
      { method: "POST", headers, credentials: "include", body: serialized },
      POST_JSON_OPTS
    );
  }
  return res;
}

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
    roleCode?: string;
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

/** Gửi mã OTP đặt lại mật khẩu (email hoặc tên đăng nhập). */
export const requestPasswordReset = async (
  usernameOrEmail: string
): Promise<{ ok: boolean; message?: string; error?: string }> => {
  try {
    const response = await postJsonWithCsrfRetry(`${getApiBase()}/api/auth/forgot-password`, {
      usernameOrEmail: usernameOrEmail.trim(),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        error: typeof result.error === "string" ? result.error : "Không thể gửi mã xác minh",
      };
    }
    return { ok: true, message: typeof result.message === "string" ? result.message : undefined };
  } catch {
    return { ok: false, error: "Không thể kết nối đến server" };
  }
};

/** Xác minh OTP trước bước đặt mật khẩu (không xóa mã trên server). */
export const verifyPasswordResetOtp = async (data: {
  usernameOrEmail: string;
  otp: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> => {
  try {
    const response = await postJsonWithCsrfRetry(`${getApiBase()}/api/auth/verify-reset-otp`, {
      usernameOrEmail: data.usernameOrEmail.trim(),
      otp: data.otp.trim().replace(/\s/g, ""),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        error: typeof result.error === "string" ? result.error : "Mã OTP không hợp lệ",
      };
    }
    return { ok: true, message: typeof result.message === "string" ? result.message : undefined };
  } catch {
    return { ok: false, error: "Không thể kết nối đến server" };
  }
};

/** Xác minh OTP và đặt mật khẩu mới (`usernameOrEmail` trùng bước gửi mã). */
export const resetPasswordWithOtp = async (data: {
  usernameOrEmail: string;
  otp: string;
  newPassword: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> => {
  try {
    const response = await postJsonWithCsrfRetry(`${getApiBase()}/api/auth/reset-password`, {
      usernameOrEmail: data.usernameOrEmail.trim(),
      otp: data.otp.trim(),
      newPassword: data.newPassword,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        error: typeof result.error === "string" ? result.error : "Đặt lại mật khẩu thất bại",
      };
    }
    return { ok: true, message: typeof result.message === "string" ? result.message : undefined };
  } catch {
    return { ok: false, error: "Không thể kết nối đến server" };
  }
};
