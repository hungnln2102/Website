import { useState } from "react";
import {
  activateRenewAdobeWebsiteProfile,
  fetchRenewAdobeWebsiteStatus,
} from "../renewAdobe.api";
import type {
  RenewAdobeWebsiteStatusCode,
  RenewAdobeWebsiteStatusResponse,
  RenewResultType,
} from "../renewAdobe.types";

export function useRenewAdobe() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resultType, setResultType] = useState<RenewResultType>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [canActivate, setCanActivate] = useState(false);
  /** no_order | order_expired — chỉ dùng khi resultType === outside-order */
  const [outsideOrderStatus, setOutsideOrderStatus] =
    useState<Extract<RenewAdobeWebsiteStatusCode, "no_order" | "order_expired"> | null>(
      null,
    );
  /** active nhưng chưa có product trên Adobe — hiện CTA mở url_access */
  const [successNeedsProductLink, setSuccessNeedsProductLink] = useState(false);
  const [urlAccess, setUrlAccess] = useState<string | null>(null);

  const resetResult = (options?: { preserveProfileName?: boolean }) => {
    setResultType(null);
    setMessage(null);
    setCanActivate(false);
    setOutsideOrderStatus(null);
    setSuccessNeedsProductLink(false);
    setUrlAccess(null);
    if (!options?.preserveProfileName) {
      setProfileName(null);
    }
  };

  const applyStatusResult = (data: RenewAdobeWebsiteStatusResponse) => {
    setProfileName(data.profileName);
    setCanActivate(data.canActivate);

    if (data.status === "active") {
      setResultType("check-success");
      setOutsideOrderStatus(null);
      setMessage(data.message);
      const acc = data.account;
      const pending = Boolean(acc && acc.userHasProduct !== true);
      setSuccessNeedsProductLink(pending);
      const rawUrl = acc?.urlAccess != null ? String(acc.urlAccess).trim() : "";
      setUrlAccess(rawUrl || null);
      return;
    }

    if (data.status === "no_order" || data.status === "order_expired") {
      setResultType("outside-order");
      setOutsideOrderStatus(data.status);
      setSuccessNeedsProductLink(false);
      setUrlAccess(null);
      setMessage(null);
      return;
    }

    setOutsideOrderStatus(null);
    setSuccessNeedsProductLink(false);
    setUrlAccess(null);
    setResultType("expired");
    setMessage(data.message);
  };

  /* ── Kiểm tra Profile từ public renew-adobe status API ── */
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
      const data = await fetchRenewAdobeWebsiteStatus(email.trim());
      applyStatusResult(data);
    } catch (err) {
      console.error("Lookup error:", err);
      setResultType("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Có lỗi kết nối tới máy chủ. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Kích hoạt Profile (POST /api/renew-adobe/public/activate) ── */
  const handleActivate = async () => {
    if (!email.trim() || activating) return;

    setActivating(true);
    resetResult({ preserveProfileName: true });

    try {
      const data = await activateRenewAdobeWebsiteProfile(email.trim());
      setProfileName(data.profileName);
      setCanActivate(false);
      setResultType("activate-success");
      setMessage(
        data.message || `Profile đã được kích hoạt thành công cho ${email.trim()}.`,
      );
    } catch (err) {
      console.error("Fix-user error:", err);
      setResultType("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Có lỗi kết nối tới dịch vụ kích hoạt. Vui lòng thử lại sau.",
      );
    } finally {
      setActivating(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    activating,
    resultType,
    message,
    profileName,
    canActivate,
    outsideOrderStatus,
    successNeedsProductLink,
    urlAccess,
    handleCheckSubmit,
    handleActivate,
  };
}
