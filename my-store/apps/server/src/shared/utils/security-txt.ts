import { env } from "@my-store/env/server";

/**
 * RFC 9116 security.txt — nội dung từ biến môi trường, mặc định theo FRONTEND_URL (store công khai).
 */
export function buildSecurityTxt(): string {
  const baseRaw = env.FRONTEND_URL ?? "https://mavrykpremium.store";
  const base = baseRaw.replace(/\/+$/, "");
  let hostname = "mavrykpremium.store";
  try {
    hostname = new URL(base).hostname;
  } catch {
    /* giữ hostname mặc định */
  }

  const contact = env.SECURITY_TXT_CONTACT ?? `mailto:support@${hostname}`;
  const policy = env.SECURITY_TXT_POLICY ?? `${base}/`;
  const canonical =
    env.SECURITY_TXT_CANONICAL ?? `${base}/.well-known/security.txt`;
  const expires = env.SECURITY_TXT_EXPIRES ?? "2027-12-31T23:59:59.000Z";

  return [
    `# Security contact (RFC 9116). Cấu hình: FRONTEND_URL, SECURITY_TXT_CONTACT, SECURITY_TXT_POLICY, SECURITY_TXT_CANONICAL, SECURITY_TXT_EXPIRES`,
    `Contact: ${contact}`,
    `Policy: ${policy}`,
    `Preferred-Languages: en, vi`,
    `Canonical: ${canonical}`,
    `Expires: ${expires}`,
  ].join("\n");
}
