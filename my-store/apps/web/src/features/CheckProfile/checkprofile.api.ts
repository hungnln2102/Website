import { getApiBase } from "@/lib/api";
import type {
  CheckProfileApiResult,
  ActivateProfileApiResult,
  OtpApiResult,
  FixAdesTransferInfo,
} from "./checkprofile.types";

/** Đồng bộ với backend `adobeSystemConstants.js`. */
export type AdobeSystemNote = "renew_adobe" | "fix_adobe_edu" | "fix_ades";

export type ResolveSystemResult =
  | { ok: true; email: string; system_note: AdobeSystemNote; order_id: string | null }
  | { ok: false; status: number; error: string };

export async function resolveAdobeSystemApi(
  email: string,
): Promise<ResolveSystemResult> {
  try {
    const url = `${getApiBase()}/api/renew-adobe/public/resolve-system?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.clone().text().catch(() => "");
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      parsed = null;
    }

    if (res.ok && parsed?.ok === true) {
      const code = String(parsed.system_note ?? "").toLowerCase();
      const allowed: AdobeSystemNote[] = [
        "renew_adobe",
        "fix_adobe_edu",
        "fix_ades",
      ];
      const normalized = (allowed.includes(code as AdobeSystemNote)
        ? code
        : "fix_adobe_edu") as AdobeSystemNote;
      return {
        ok: true,
        email: String(parsed.email ?? email),
        system_note: normalized,
        order_id: (parsed.order_id as string | null) ?? null,
      };
    }

    return {
      ok: false,
      status: res.status,
      error: "Email không có trong hệ thống.",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Không kiểm tra được hệ thống cho email này lúc này.",
    };
  }
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getFixAdesTransferResponse(
  parsed: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const outerData = asRecord(parsed?.data);
  const transferData = asRecord(outerData?.data);
  return asRecord(transferData?.transferTeamResponse);
}


const FIX_ADES_DIRECT_ORIGIN = "https://api-2026-02.ades.support";
const FIX_ADES_DIRECT_BASE_URL = `${FIX_ADES_DIRECT_ORIGIN}/ades-support`;
const FIX_ADES_DIRECT_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
};

async function fetchFixAdesDirectToken(): Promise<{
  token: string;
  fallbackPayload: Record<string, unknown> | null;
}> {
  const tokenRes = await fetch(`${FIX_ADES_DIRECT_BASE_URL}/auth/token`, {
    method: "POST",
    headers: FIX_ADES_DIRECT_HEADERS,
    body: "{}",
  });
  const tokenText = await tokenRes.text().catch(() => "");
  const tokenJson = tryParseJson(tokenText);
  const tokenData = asRecord(tokenJson?.data);
  const token = String(tokenData?.token ?? tokenJson?.token ?? "").trim();
  if (!tokenRes.ok) return { token: "", fallbackPayload: null };
  return { token, fallbackPayload: token ? null : tokenJson };
}

function buildFixAdesDirectAuthHeaders(token: string) {
  return {
    ...FIX_ADES_DIRECT_HEADERS,
    Authorization: `Bearer ${token}`,
    "x-access-token": token,
  };
}

async function fetchFixAdesTransferStatusDirect(
  email: string,
): Promise<Record<string, unknown> | null> {
  const { token, fallbackPayload } = await fetchFixAdesDirectToken();
  if (!token) return fallbackPayload;

  const statusRes = await fetch(`${FIX_ADES_DIRECT_BASE_URL}/check-transfer-status`, {
    method: "POST",
    headers: buildFixAdesDirectAuthHeaders(token),
    body: JSON.stringify({ email }),
  });
  const statusText = await statusRes.text().catch(() => "");
  const statusJson = tryParseJson(statusText);
  if (!statusRes.ok || !statusJson) return null;

  return {
    ok: true,
    status: statusRes.status,
    data: statusJson,
  };
}

function createFixAdesTransferInfo(
  status: string,
  currentTeam: string | null,
  targetTeam: string | null,
  fallbackStatusText: string,
  options: { action?: FixAdesTransferInfo["action"]; showTeams?: boolean } = {},
): FixAdesTransferInfo {
  const normalizedStatus = status.trim().toLowerCase();
  const hasTeamMismatch = Boolean(
    currentTeam &&
      targetTeam &&
      currentTeam.trim().toLowerCase() !== targetTeam.trim().toLowerCase(),
  );
  const needsTransfer =
    hasTeamMismatch ||
    normalizedStatus === "sync-required" ||
    normalizedStatus === "inactive" ||
    normalizedStatus === "expired" ||
    normalizedStatus === "not active" ||
    normalizedStatus === "not_active" ||
    normalizedStatus === "het han";
  const isActive =
    !needsTransfer &&
    (normalizedStatus === "active" ||
      normalizedStatus === "processing" ||
      normalizedStatus === "dang xu ly" ||
      normalizedStatus === "dang hoat dong");
  const isSyncAction = options.action === "sync" || options.showTeams === false;

  return {
    statusText: isSyncAction
      ? fallbackStatusText || "Chưa đồng bộ dữ liệu"
      : isActive
        ? "T\u00e0i kho\u1ea3n \u0111ang ho\u1ea1t \u0111\u1ed9ng"
        : needsTransfer
          ? "C\u1ea7n chuy\u1ec3n Profile"
          : fallbackStatusText || "\u0110\u00e3 ki\u1ec3m tra tr\u1ea1ng th\u00e1i",
    statusTone: isActive ? "success" : needsTransfer || isSyncAction ? "warning" : "error",
    currentTeam,
    targetTeam,
    action: options.action ?? (needsTransfer ? "renew" : "none"),
    showTeams: options.showTeams ?? true,
  };
}

function getReadableServerText(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
}

export async function checkProfileApi(
  email: string,
): Promise<CheckProfileApiResult> {
  const res = await fetch(`${getApiBase()}/api/fix-adobe/check-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const text = await res.clone().text().catch(() => "");

  if (!res.ok) {
    return {
      type: "error",
      message: text
        ? `Không kiểm tra được profile.\n\nThông báo từ server:\n${text}`
        : "Không kiểm tra được profile. Vui lòng thử lại sau.",
      profileName: null,
    };
  }

  const parsed = tryParseJson(text);

  let type: CheckProfileApiResult["type"] = "info";
  let finalMessage = "";
  let name: string | null = null;

  if (parsed && typeof parsed === "object") {
    const status = String(parsed.status ?? parsed.result ?? "").toLowerCase();
    name =
      (parsed.profileName as string) ??
      (parsed.profile_name as string) ??
      (parsed.profile as string) ??
      null;
    const expiredFlag = Boolean(parsed.expired);
    const successFlag = Boolean(parsed.success);
    const foundFlag =
      parsed.found !== undefined ? Boolean(parsed.found) : undefined;

    if (expiredFlag || status.includes("expired")) {
      type = "expired";
      finalMessage =
        (parsed.message as string) ||
        (parsed.result_message as string) ||
        "Profile đã hết hạn, vui lòng kích hoạt lại.";
    } else if (
      successFlag ||
      status === "success" ||
      status === "active"
    ) {
      type = "check-success";
      finalMessage =
        (parsed.message as string) ||
        (parsed.result_message as string) ||
        "Profile đang hoạt động bình thường.";
    } else if (
      foundFlag === false ||
      status.includes("error") ||
      status.includes("fail") ||
      status === "not_found"
    ) {
      type = "error";
      finalMessage =
        (parsed.message as string) ||
        (parsed.result_message as string) ||
        (parsed.error as string) ||
        "Không tìm thấy profile. Vui lòng liên hệ hỗ trợ.";
    } else {
      type = "info";
      finalMessage =
        (parsed.message as string) ||
        (parsed.result_message as string) ||
        text;
    }
  } else {
    const normalized = text.toLowerCase();
    finalMessage = text;
    if (
      normalized.includes("profile active") ||
      normalized.includes("profile is active")
    ) {
      type = "check-success";
      const parts = text.split(":");
      if (parts.length > 1) name = parts.slice(1).join(":").trim();
    } else if (
      normalized.includes("hết hạn") ||
      normalized.includes("het han") ||
      normalized.includes("expired") ||
      normalized.includes("activate.mkvest.com")
    ) {
      type = "expired";
    } else if (
      normalized.includes("not in warrant") ||
      normalized.includes("contact seller")
    ) {
      type = "error";
    } else {
      type = "info";
    }
  }

  return { type, message: finalMessage, profileName: name };
}

export async function activateProfileApi(
  email: string,
  currentProfileName: string | null,
): Promise<ActivateProfileApiResult> {
  const res = await fetch(`${getApiBase()}/api/fix-adobe/switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const text = await res.clone().text().catch(() => "");

  if (!res.ok) {
    return {
      type: "error",
      message: text
        ? `Không kích hoạt lại được profile.\n\nThông báo từ server:\n${text}`
        : "Không kích hoạt lại được profile. Vui lòng thử lại sau.",
      profileName: null,
    };
  }

  const parsed = tryParseJson(text);

  let finalMessage = "";
  let type: ActivateProfileApiResult["type"] = "info";
  let name: string | null = null;

  if (parsed && typeof parsed === "object") {
    const status = String(parsed.status ?? "").toLowerCase();
    name =
      (parsed.profile_name as string) ??
      (parsed.profile as string) ??
      currentProfileName ??
      null;
    if (status === "success") {
      type = "activate-success";
      finalMessage =
        (parsed.message as string) ||
        `Profile đã được kích hoạt thành công cho ${email}.`;
    } else if (status === "failed") {
      type = "error";
      finalMessage =
        (parsed.message as string) ||
        (parsed.error as string) ||
        "Kích hoạt lại profile thất bại. Vui lòng liên hệ hỗ trợ.";
    } else if (status === "not_found") {
      type = "error";
      finalMessage =
        (parsed.message as string) ||
        (parsed.error as string) ||
        "Không tìm thấy tác vụ kích hoạt. Vui lòng thử lại sau.";
    } else {
      type = "info";
      finalMessage =
        (parsed.message as string) ||
        (parsed.error as string) ||
        text ||
        "Đã gửi yêu cầu kích hoạt lại profile.";
    }
  } else {
    finalMessage = text || "Đã gửi yêu cầu kích hoạt lại profile.";
    type = "info";
  }

  return { type, message: finalMessage, profileName: name };
}

export async function sendOtpApi(email: string): Promise<OtpApiResult> {
  const res = await fetch(`${getApiBase()}/api/renew-adobe/public/get-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const text = await res.clone().text().catch(() => "");
  const parsed = tryParseJson(text);

  if (!res.ok) {
    const serverText = getReadableServerText(text);
    return {
      type: "error",
      message:
        (parsed?.message as string) ||
        (parsed?.error as string) ||
        serverText ||
        "Không gửi được OTP. Vui lòng thử lại sau.",
    };
  }

  const data = (parsed?.data as Record<string, unknown> | null) || null;
  const otpData = (data?.otp as Record<string, unknown> | null) || null;

  return {
    type: "info",
    message:
      (parsed?.message as string) ||
      `Đã lấy OTP cho ${email} thành công.`,
    otp: otpData
      ? {
          code: String(otpData.code ?? ""),
          service: String(otpData.service ?? "unknown"),
          timeStr: (otpData.time_str as string | undefined) ?? null,
          timestampMs:
            Number.parseInt(String(otpData.timestamp_ms ?? ""), 10) || null,
        }
      : undefined,
  };
}

export async function sendFixAdesOtpApi(email: string): Promise<OtpApiResult> {
  const res = await fetch(
    `${FIX_ADES_DIRECT_ORIGIN}/mail/read-otp-gpm?email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: FIX_ADES_DIRECT_HEADERS,
    },
  );
  const text = await res.text().catch(() => "");
  const parsed = tryParseJson(text);
  const data = asRecord(parsed?.data);
  const otpData = asRecord(data?.otp) ?? data;
  const rawCode = String(
    otpData?.code ??
      otpData?.otp ??
      otpData?.otpCode ??
      otpData?.pin ??
      otpData?.password ??
      "",
  ).trim();
  const code = rawCode || text.match(/\b\d{6}\b/)?.[0] || "";
  const success = parsed?.success === true && data?.success !== false && Boolean(code);

  if (!res.ok || !success) {
    const serverText = getReadableServerText(text);
    return {
      type: "error",
      message:
        String(data?.message ?? data?.error ?? parsed?.message ?? parsed?.error ?? "").trim() ||
        serverText ||
        "Không lấy được OTP Ades. Vui lòng thử lại sau.",
    };
  }

  return {
    type: "info",
    message: `Đã lấy OTP Ades cho ${email} thành công.`,
    otp: {
      code,
      service: String(otpData?.service ?? "ades"),
      timeStr: String(otpData?.timeStr ?? otpData?.time_str ?? "").trim() || null,
      timestampMs:
        Number.parseInt(String(otpData?.timestampMs ?? otpData?.timestamp_ms ?? ""), 10) ||
        null,
    },
  };
}

/**
 * Lấy status Renew Adobe của email — đã có sẵn ở admin_orderlist
 * (`/api/renew-adobe/public/status`) và proxy qua Website server.
 */
export async function getRenewAdobeStatusApi(
  email: string,
): Promise<CheckProfileApiResult> {
  try {
    const url = `${getApiBase()}/api/renew-adobe/public/status?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { method: "GET" });
    const text = await res.clone().text().catch(() => "");
    let parsed = tryParseJson(text);

    if (!res.ok) {
      return {
        type: "error",
        message:
          (parsed?.error as string) ||
          (parsed?.message as string) ||
          "Không kiểm tra được trạng thái Renew Adobe.",
        profileName: null,
      };
    }

    const status = String(parsed?.status ?? "").toLowerCase();
    const message =
      (parsed?.message as string) ||
      "Đã kiểm tra trạng thái tài khoản Renew Adobe.";
    const profileName = (parsed?.profileName as string) ?? null;

    if (status === "active") {
      return { type: "check-success", message, profileName };
    }
    if (status === "expired") {
      return { type: "expired", message, profileName };
    }
    if (status === "error" || status === "not_found") {
      return { type: "error", message, profileName };
    }
    return { type: "info", message, profileName };
  } catch {
    return {
      type: "error",
      message: "Không kết nối được dịch vụ Renew Adobe. Vui lòng thử lại sau.",
      profileName: null,
    };
  }
}

/**
 * Check 1 email qua hệ thống Fix Ades (proxy public của admin_orderlist).
 * Backend tự verify tracking system_note='fix_ades' trước khi gọi Ades.
 */
export async function checkFixAdesPublicApi(
  email: string,
): Promise<CheckProfileApiResult> {
  try {
    let parsed = await fetchFixAdesTransferStatusDirect(email);

    if (!parsed) {
      const res = await fetch(
        `${getApiBase()}/api/renew-adobe/public/fix-ades/check-transfer-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const text = await res.clone().text().catch(() => "");
      parsed = tryParseJson(text);

      if (!res.ok) {
        const errorMessage =
          (parsed?.error as string) ||
          (parsed?.message as string) ||
          "Không kiểm tra được tài khoản Fix Ades.";
        return {
          type: "error",
          message: errorMessage,
          profileName: null,
          transferInfo: null,
        };
      }
    }

    if (!parsed) {
      return {
        type: "error",
        message: "Không kiểm tra được tài khoản Fix Ades.",
        profileName: null,
        transferInfo: null,
      };
    }

    const data = asRecord(parsed?.data);
    const transferData = asRecord(data?.data);
    const transfer = getFixAdesTransferResponse(parsed);
    const isSyncRequired = Boolean(transferData?.existedInSystem) && !transfer;
    if (isSyncRequired) {
      return {
        type: "info",
        message: "Tài khoản chưa có dữ liệu profile. Vui lòng liên hệ admin để được hỗ trợ.",
        profileName: null,
        transferInfo: null,
      };
    }

    const status = String(transfer?.status ?? data?.status ?? "").toLowerCase();
    const teamName = String(transfer?.teamName ?? data?.teamName ?? "").trim();
    const targetTeamName = String(transfer?.switchTargetTeamName ?? "").trim();
    const targetTeam = targetTeamName || null;
    const isTransferRequired = Boolean(targetTeam);
    const isError =
      status === "error" ||
      status === "failed" ||
      status === "fail" ||
      status === "not_found";

    const rawMessage = String(
      data?.message ?? data?.error ?? parsed?.error ?? parsed?.message ?? "",
    ).trim();

    const message = rawMessage || (isTransferRequired
      ? `C?n chuy?n Profile sang ${targetTeam}.`
      : isError
        ? "T?i kho?n Fix Ades ?ang l?i, vui l?ng ki?m tra l?i."
        : "T?i kho?n Fix Ades ?ang ho?t ??ng.");

    return {
      type: isTransferRequired ? "expired" : isError ? "error" : "check-success",
      message,
      profileName: teamName || null,
      transferInfo: isTransferRequired
        ? createFixAdesTransferInfo(status || "inactive", teamName || null, targetTeam, message, {
            action: "renew",
          })
        : null,
    };
  } catch {
    return {
      type: "error",
      message: "Không kết nối được dịch vụ Fix Ades. Vui lòng thử lại sau.",
      profileName: null,
    };
  }
}


export async function switchFixAdesOrganizationApi(
  email: string,
): Promise<ActivateProfileApiResult> {
  try {
    const { token } = await fetchFixAdesDirectToken();
    if (!token) {
      return {
        type: "error",
        message: "Không lấy được phiên xác thực chuyển profile.",
        profileName: null,
      };
    }

    const res = await fetch(`${FIX_ADES_DIRECT_BASE_URL}/switch-organization`, {
      method: "POST",
      headers: buildFixAdesDirectAuthHeaders(token),
      body: JSON.stringify({ email }),
    });
    const text = await res.text().catch(() => "");
    const parsed = tryParseJson(text);
    const data = asRecord(parsed?.data);
    const success = data?.success === true || parsed?.success === true;
    const profileName = String(data?.newOrganizationName ?? "").trim() || null;

    if (!res.ok || !success) {
      return {
        type: "error",
        message:
          String(data?.message ?? parsed?.message ?? parsed?.error ?? "").trim() ||
          "Không chuyển profile được.",
        profileName,
      };
    }

    return {
      type: "activate-success",
      message:
        String(data?.message ?? parsed?.message ?? "").trim() ||
        "Chuyển profile thành công. Hãy đăng xuất Adobe và đăng nhập lại.",
      profileName,
    };
  } catch {
    return {
      type: "error",
      message: "Không kết nối được dịch vụ chuyển profile. Vui lòng thử lại sau.",
      profileName: null,
    };
  }
}


export async function syncFixAdesAccountApi(
  email: string,
): Promise<ActivateProfileApiResult> {
  try {
    const { token } = await fetchFixAdesDirectToken();
    if (!token) {
      return {
        type: "error",
        message: "Không lấy được phiên xác thực đồng bộ dữ liệu.",
        profileName: null,
      };
    }

    const res = await fetch(`${FIX_ADES_DIRECT_BASE_URL}/sync-ado-account`, {
      method: "POST",
      headers: buildFixAdesDirectAuthHeaders(token),
      body: JSON.stringify({ email }),
    });
    const text = await res.text().catch(() => "");
    const parsed = tryParseJson(text);
    const data = asRecord(parsed?.data);
    const success = data?.success === true || parsed?.success === true;
    const profileName =
      String(data?.teamName ?? data?.newOrganizationName ?? data?.profileName ?? "").trim() ||
      null;

    if (!res.ok || !success) {
      return {
        type: "error",
        message:
          String(data?.message ?? parsed?.message ?? parsed?.error ?? "").trim() ||
          "Không đồng bộ dữ liệu được.",
        profileName,
      };
    }

    return {
      type: "activate-success",
      message:
        String(data?.message ?? parsed?.message ?? "").trim() ||
        "Đồng bộ dữ liệu thành công. Hãy kiểm tra lại tài khoản.",
      profileName,
    };
  } catch {
    return {
      type: "error",
      message: "Không kết nối được dịch vụ đồng bộ dữ liệu. Vui lòng thử lại sau.",
      profileName: null,
    };
  }
}

export async function renewFixAdesPublicApi(
  email: string,
): Promise<ActivateProfileApiResult> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/renew-adobe/public/fix-ades/renew`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );
    const text = await res.clone().text().catch(() => "");
    let parsed = tryParseJson(text);

    if (!res.ok) {
      return {
        type: "error",
        message:
          (parsed?.error as string) ||
          "Không gia hạn được tài khoản Fix Ades.",
        profileName: null,
      };
    }

    const data = (parsed?.data as Record<string, unknown> | null) || null;
    const userObj = (data?.user as Record<string, unknown> | undefined) || {};
    const expiresAtRaw = String(userObj?.expiresAt ?? "");
    const expiresAt = expiresAtRaw
      ? new Date(expiresAtRaw).toLocaleDateString("vi-VN")
      : null;
    const products = Array.isArray(userObj?.products)
      ? (userObj.products as string[]).join(", ")
      : "";
    const success = data?.success === true;
    const message =
      (data?.message as string) ||
      (success
        ? `Đã gia hạn thành công${
            expiresAt ? ` đến ${expiresAt}` : ""
          }${products ? ` — ${products}` : ""}.`
        : "Đã gửi yêu cầu gia hạn Fix Ades.");

    return {
      type: success ? "activate-success" : "info",
      message,
      profileName: products || null,
    };
  } catch {
    return {
      type: "error",
      message: "Không kết nối được dịch vụ Fix Ades. Vui lòng thử lại sau.",
      profileName: null,
    };
  }
}

export async function activateRenewAdobeApi(
  email: string,
): Promise<ActivateProfileApiResult> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/renew-adobe/public/activate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );
    const text = await res.clone().text().catch(() => "");
    let parsed = tryParseJson(text);

    if (!res.ok) {
      return {
        type: "error",
        message:
          (parsed?.error as string) ||
          (parsed?.message as string) ||
          "Không kích hoạt được Renew Adobe.",
        profileName: null,
      };
    }

    const success = Boolean(parsed?.success);
    const message =
      (parsed?.message as string) ||
      (success
        ? "Đã kích hoạt thành công Renew Adobe."
        : "Đã gửi yêu cầu Renew Adobe.");
    const profileName = (parsed?.profileName as string) ?? null;
    return {
      type: success ? "activate-success" : "info",
      message,
      profileName,
    };
  } catch {
    return {
      type: "error",
      message: "Không kết nối được dịch vụ Renew Adobe. Vui lòng thử lại sau.",
      profileName: null,
    };
  }
}

export async function verifyOtpApi(
  email: string,
  otp: string,
): Promise<OtpApiResult> {
  const res = await fetch(`${getApiBase()}/api/fix-adobe/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const text = await res.clone().text().catch(() => "");
  const parsed = tryParseJson(text);

  if (!res.ok) {
    const serverText = getReadableServerText(text);
    return {
      type: "error",
      message:
        (parsed?.message as string) ||
        (parsed?.error as string) ||
        serverText ||
        "Mã OTP không đúng hoặc đã hết hạn.",
    };
  }

  return {
    type: "success",
    message:
      (parsed?.message as string) ||
      "Xác nhận OTP thành công! Profile đã được cập nhật.",
  };
}
