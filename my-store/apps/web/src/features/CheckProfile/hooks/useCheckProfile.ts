import { useState } from "react";
import type { CheckResultType, OtpResultType } from "../checkprofile.types";
import {
  checkProfileApi,
  activateProfileApi,
  sendOtpApi,
  verifyOtpApi,
} from "../checkprofile.api";

export function useCheckProfile() {
  const [email, setEmail] = useState("");
  const [isCheckMode, setIsCheckMode] = useState(true);

  /* ── Check + Activate state ── */
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resultType, setResultType] = useState<CheckResultType>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

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
  };

  const resetOtp = () => {
    setOtpSent(false);
    setOtpCode("");
    setOtpMessage(null);
    setOtpResultType(null);
  };

  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Vui lòng nhập email để kiểm tra.");
      setResultType("info");
      return;
    }
    setLoading(true);
    resetResult();
    try {
      const result = await checkProfileApi(email.trim());
      setMessage(result.message);
      setResultType(result.type);
      setProfileName(result.profileName);
    } catch (err) {
      setMessage(
        "Có lỗi kết nối tới máy chủ kiểm tra profile. Vui lòng thử lại sau.",
      );
      console.error("CheckProfile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!email.trim() || activating) return;
    setActivating(true);
    resetResult();
    try {
      const result = await activateProfileApi(email.trim(), profileName);
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
    if (!email.trim() || sendingOtp) return;
    setSendingOtp(true);
    setOtpMessage(null);
    setOtpResultType(null);
    setOtpSent(false);
    try {
      const result = await sendOtpApi(email.trim());
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

  return {
    email,
    setEmail,
    isCheckMode,
    setIsCheckMode,

    loading,
    activating,
    resultType,
    message,
    profileName,
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
