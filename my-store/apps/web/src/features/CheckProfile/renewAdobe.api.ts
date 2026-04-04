import { authFetch } from "@/features/auth/api/auth";
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

export async function activateRenewAdobeWebsiteProfile(
  email: string,
): Promise<RenewAdobeWebsiteStatusResponse> {
  const res = await authFetch(`${getApiBase()}/api/renew-adobe/public/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
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
