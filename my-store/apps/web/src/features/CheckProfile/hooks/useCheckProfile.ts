import { useState } from "react";
import type { CheckResultType, FixAdesTransferInfo, OtpResultType } from "../checkprofile.types";
import {
  activateProfileApi,
  activateRenewAdobeApi,
  checkFixAdesPublicApi,
  checkProfileApi,
  getRenewAdobeStatusApi,
  renewFixAdesPublicApi,
  switchFixAdesOrganizationApi,
  syncFixAdesAccountApi,
  resolveAdobeSystemApi,
  sendFixAdesOtpApi,
  sendOtpApi,
  verifyOtpApi,
  type AdobeSystemNote,
} from "../checkprofile.api";

type DispatcherDecision =
  | { kind: "ok"; system: AdobeSystemNote }
  | { kind: "blocked"; message: string };

const FIX_ADES_NO_OTP_MSG =
  "Hệ thống Fix Ades không cấp OTP profile — chỉ cần bấm Kiểm tra hoặc Renew ở khung bên trái.";

const FIX_ADES_REFRESH_RETRY_DELAYS_MS = [0, 1000, 2000];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function refreshFixAdesStatusAfterAction(email: string) {
  let latest = await checkFixAdesPublicApi(email);

  for (const delay of FIX_ADES_REFRESH_RETRY_DELAYS_MS.slice(1)) {
    if (latest.type === "check-success" && !latest.transferInfo) break;
    await wait(delay);
    latest = await checkFixAdesPublicApi(email);
  }

  return latest;
}

export function useCheckProfile() {
  const [email, setEmail] = useState("");
  const [isCheckMode, setIsCheckMode] = useState(true);

  /* ── Resolved system_note theo email (cache cuối cùng đã check) ── */
  const [resolvedSystem, setResolvedSystem] = useState<AdobeSystemNote | null>(
    null,
  );
  const [resolvedEmail, setResolvedEmail] = useState<string>("");

  /* ── Check + Activate state ── */
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resultType, setResultType] = useState<CheckResultType>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [transferInfo, setTransferInfo] = useState<FixAdesTransferInfo | null>(null);
  const [canRenewOnError, setCanRenewOnError] = useState(false);

  /* ── OTP state ── */
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpResultType, setOtpResultType] = useState<OtpResultType>(null);

  const resetResult = () => {
    setResultType(null);
    setMessage(null);
    setProfileName(null);
    setTransferInfo(null);
    setCanRenewOnError(false);
  };

  const resetOtp = () => {
    setOtpSent(false);
    setOtpCode("");
    setOtpMessage(null);
    setOtpResultType(null);
  };

  /**
   * Resolve system_note cho email — gọi backend tracking lookup.
   * Trả về quyết định: ok (system_note + flow), hoặc blocked (lý do).
   */
  const resolveDispatcher = async (
    targetEmail: string,
  ): Promise<DispatcherDecision> => {
    if (resolvedEmail === targetEmail && resolvedSystem) {
      return { kind: "ok", system: resolvedSystem };
    }
    const result = await resolveAdobeSystemApi(targetEmail);
    if (!result.ok) {
      return { kind: "blocked", message: result.error };
    }
    setResolvedSystem(result.system_note);
    setResolvedEmail(targetEmail);
    return { kind: "ok", system: result.system_note };
  };

  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Vui lòng nhập email để kiểm tra.");
      setResultType("info");
      return;
    }
    setLoading(true);
    resetResult();
    try {
      const fixAdesFirst = await checkFixAdesPublicApi(trimmed);
      if (fixAdesFirst.type !== "error") {
        setMessage(fixAdesFirst.message);
        setResultType(fixAdesFirst.type);
        setProfileName(fixAdesFirst.profileName);
        setTransferInfo(fixAdesFirst.transferInfo ?? null);
        setCanRenewOnError(false);
        setResolvedSystem("fix_ades");
        setResolvedEmail(trimmed);
        return;
      }

      const decision = await resolveDispatcher(trimmed);
      if (decision.kind === "blocked") {
        setMessage(decision.message);
        setResultType("error");
        setProfileName(null);
        setTransferInfo(null);
        setCanRenewOnError(false);
        return;
      }

      const result =
        decision.system === "fix_ades"
          ? fixAdesFirst
          : decision.system === "renew_adobe"
            ? await getRenewAdobeStatusApi(trimmed)
            : await checkProfileApi(trimmed);

      setMessage(result.message);
      setResultType(result.type);
      setProfileName(result.profileName);
      setTransferInfo(result.transferInfo ?? null);
      setCanRenewOnError(
        result.type === "error" &&
          (decision.system === "renew_adobe" || decision.system === "fix_ades"),
      );
    } catch (err) {
      setMessage(
        "Có lỗi kết nối tới máy chủ kiểm tra profile. Vui lòng thử lại sau.",
      );
      setResultType("error");
      console.error("CheckProfile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    const trimmed = email.trim();
    if (!trimmed || activating) return;
    setActivating(true);
    resetResult();
    try {
      if (transferInfo?.action === "renew" || transferInfo?.action === "sync") {
        const result =
          transferInfo.action === "renew"
            ? await switchFixAdesOrganizationApi(trimmed)
            : await syncFixAdesAccountApi(trimmed);

        if (result.type === "activate-success") {
          const refreshed = await refreshFixAdesStatusAfterAction(trimmed);
          setMessage(refreshed.message);
          setResultType(refreshed.type);
          setProfileName(refreshed.profileName ?? result.profileName);
          setTransferInfo(refreshed.transferInfo ?? null);
          setCanRenewOnError(false);
          return;
        }

        setMessage(result.message);
        setResultType(result.type);
        setProfileName(result.profileName);
        setTransferInfo(null);
        return;
      }

      const decision = await resolveDispatcher(trimmed);
      if (decision.kind === "blocked") {
        setMessage(decision.message);
        setResultType("error");
        return;
      }

      const result =
        decision.system === "fix_ades"
          ? await renewFixAdesPublicApi(trimmed)
          : decision.system === "renew_adobe"
            ? await activateRenewAdobeApi(trimmed)
            : await activateProfileApi(trimmed, profileName);

      setMessage(result.message);
      setResultType(result.type);
      setProfileName(result.profileName);
    } catch (err) {
      console.error("Activate error:", err);
      setResultType("error");
      setMessage(
        "Có lỗi kết nối tới dịch vụ kích hoạt profile. Vui lòng thử lại sau.",
      );
    } finally {
      setActivating(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || sendingOtp) return;
    setSendingOtp(true);
    setOtpMessage(null);
    setOtpResultType(null);
    setOtpSent(false);
    try {
      const decision = await resolveDispatcher(trimmed);
      if (decision.kind === "blocked") {
        setOtpResultType("error");
        setOtpMessage(decision.message);
        return;
      }
      
      // Cho phép cả fix_adobe_edu và fix_ades lấy OTP.
      if (decision.system === "renew_adobe") {
        setOtpResultType("info");
        setOtpMessage("Hệ thống Renew Adobe không dùng OTP profile. Bấm Kiểm tra hoặc Kích hoạt ở khung bên trái.");
        return;
      }

      const result =
        decision.system === "fix_ades"
          ? await sendFixAdesOtpApi(trimmed)
          : await sendOtpApi(trimmed);
      if (result.type === "error") {
        setOtpResultType("error");
        setOtpMessage(result.message);
      } else {
        setOtpSent(true);
        setOtpMessage(result.message);
        setOtpResultType("info");
        if (result.otp?.code) {
          setOtpCode(result.otp.code);
        }
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setOtpResultType("error");
      setOtpMessage("Có lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otpCode.trim() || verifyingOtp) return;
    setVerifyingOtp(true);
    setOtpMessage(null);
    setOtpResultType(null);
    try {
      const result = await verifyOtpApi(email.trim(), otpCode.trim());
      setOtpResultType(result.type);
      setOtpMessage(result.message);
      if (result.type === "success") setOtpCode("");
    } catch (err) {
      console.error("Verify OTP error:", err);
      setOtpResultType("error");
      setOtpMessage("Có lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleEmailChange = (next: string) => {
    setEmail(next);
    if (resolvedEmail && next.trim().toLowerCase() !== resolvedEmail.toLowerCase()) {
      // Email mới → reset cache resolve để lần sau gọi lại API.
      setResolvedSystem(null);
      setResolvedEmail("");
    }
  };

  return {
    email,
    setEmail: handleEmailChange,
    isCheckMode,
    setIsCheckMode,

    /** System được gắn note cho email vừa kiểm tra (null nếu chưa resolve). */
    resolvedSystem,

    loading,
    activating,
    resultType,
    message,
    profileName,
    transferInfo,
    canRenewOnError,
    handleCheckSubmit,
    handleActivate,

    otpSent,
    otpCode,
    setOtpCode,
    sendingOtp,
    verifyingOtp,
    otpMessage,
    otpResultType,
    handleSendOtp,
    handleVerifyOtp,
    resetOtp,
  };
}
