import { getApiBase } from "@/lib/api";
import type {
  CheckProfileApiResult,
  ActivateProfileApiResult,
  OtpApiResult,
} from "./checkprofile.types";

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
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
  const res = await fetch(`${getApiBase()}/api/fix-adobe/send-otp`, {
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

  return {
    type: "info",
    message:
      (parsed?.message as string) ||
      `Đã lấy OTP cho ${email} từ hệ thống OTP.`,
    otp:
      parsed?.otp && typeof parsed.otp === "object"
        ? {
            code: String((parsed.otp as Record<string, unknown>).code ?? ""),
            service: String(
              (parsed.otp as Record<string, unknown>).service ?? "unknown",
            ),
            timeStr:
              ((parsed.otp as Record<string, unknown>).time_str as
                | string
                | undefined) ?? null,
            timestampMs: Number.parseInt(
              String(
                (parsed.otp as Record<string, unknown>).timestamp_ms ?? "",
              ),
              10,
            ) || null,
          }
        : undefined,
  };
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
