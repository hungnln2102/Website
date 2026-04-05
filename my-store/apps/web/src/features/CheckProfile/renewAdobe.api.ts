import {
  apiFetch,
  getApiBase,
  handleApiError,
} from "@/lib/api/client";
import type { RenewAdobeWebsiteStatusResponse } from "./renewAdobe.types";

type ApiErrorShape = {
  success?: boolean;
  error?: string;
  message?: string;
};

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function throwApiError(
  res: Response,
  data: ApiErrorShape | null,
  fallbackMessage: string,
): never {
  const message = data?.error || data?.message;
  if (message) {
    throw new Error(message);
  }

  handleApiError(res, fallbackMessage);
}

export async function fetchRenewAdobeWebsiteStatus(
  email: string,
): Promise<RenewAdobeWebsiteStatusResponse> {
  const res = await apiFetch(
    `${getApiBase()}/api/renew-adobe/public/status?email=${encodeURIComponent(email)}`,
    {
      credentials: "include",
    },
    45_000,
  );
  const data = await readJsonSafe<RenewAdobeWebsiteStatusResponse & ApiErrorShape>(res);

  if (!res.ok || !data?.success) {
    throwApiError(
      res,
      data,
      "Không kiểm tra được profile. Vui lòng thử lại sau.",
    );
  }

  return data;
}

/** Kích hoạt có thể chạy add user Playwright — timeout dài; API public không cần Bearer/CSRF store. */
const ACTIVATE_TIMEOUT_MS = 600_000;

export async function activateRenewAdobeWebsiteProfile(
  email: string,
): Promise<RenewAdobeWebsiteStatusResponse> {
  const res = await apiFetch(
    `${getApiBase()}/api/renew-adobe/public/activate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    },
    ACTIVATE_TIMEOUT_MS,
  );
  const data = await readJsonSafe<RenewAdobeWebsiteStatusResponse & ApiErrorShape>(res);

  if (!res.ok || !data?.success) {
    throwApiError(
      res,
      data,
      "Không kích hoạt được profile. Vui lòng thử lại sau.",
    );
  }

  return data;
}
