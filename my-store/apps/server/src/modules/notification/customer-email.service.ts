/**
 * Gửi email khách hàng qua Resend (API: https://resend.com/docs/api-reference/emails/send-email).
 *
 * Biến môi trường:
 * - SEND_MAIL_API_KEY — API key Resend (đã dùng cho webhook)
 * - MAIL_FROM — ví dụ: Mavryk Premium <no-reply@mavrykpremium.store> (domain đã verify trên Resend)
 * - MAIL_FROM_PASSWORD_RESET — (tùy chọn) from cho mail OTP; mặc định Support <support@mavrykpremium.store>
 * - MAIL_COMPANY_NAME — thay {{company_name}} trong mail OTP (mặc định Mavryk Premium)
 * - FRONTEND_URL — link trong nội dung mail (tùy chọn)
 * - MAIL_LOGO_URL — (tùy chọn) URL tuyệt đối ảnh logo mail OTP; mặc định {FRONTEND_URL}/assets/images/logo-transparent (khớp brandingAssets trên web)
 */

import { Resend } from "resend";
import logger from "../../shared/utils/logger";

const API_KEY = process.env.SEND_MAIL_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM?.trim() || "Mavryk Premium <onboarding@resend.dev>";
const PASSWORD_RESET_FROM =
  process.env.MAIL_FROM_PASSWORD_RESET?.trim() || "Support <support@mavrykpremium.store>";
const COMPANY_NAME = process.env.MAIL_COMPANY_NAME?.trim() || "Mavryk Premium";
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://mavrykpremium.store").replace(/\/+$/, "");

/** Cùng đường dẫn extensionless như `apps/web/src/lib/brandingAssets.ts` — nginx/Vite resolve đuôi .webp/.png/… */
const PASSWORD_RESET_EMAIL_LOGO_URL =
  process.env.MAIL_LOGO_URL?.trim() || `${FRONTEND_URL}/assets/images/logo-transparent`;

/** Đồng bộ với OTP_TTL_SEC trong password-reset.service (phút). */
const PASSWORD_RESET_OTP_EXPIRE_MINUTES = 15;

/** HTML gửi kèm OTP ({{user_name}}, {{otp_code}}, {{expire_minutes}}, {{company_name}}, {{logo_url}}). */
const PASSWORD_RESET_OTP_EMAIL_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mã xác thực OTP</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, Helvetica, sans-serif; color:#333333;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f7; margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">

          <tr>
            <td align="center" style="background-color:#111827; padding:24px; position:relative;">
              
              <img
                src="{{logo_url}}"
                alt="{{company_name}}"
                width="90"
                style="display:block; position:absolute; top:18px; left:18px; width:90px; height:auto;"
              />

              <h1 style="margin:0; font-size:24px; color:#ffffff;">Đặt Lại Mật Khẩu</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px; font-size:16px; line-height:24px;">
                Xin chào <strong>{{user_name}}</strong>,
              </p>

              <p style="margin:0 0 16px; font-size:16px; line-height:24px;">
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Vui lòng sử dụng mã OTP dưới đây để tiếp tục:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <div style="display:inline-block; background-color:#f3f4f6; border:1px dashed #d1d5db; border-radius:10px; padding:16px 32px; font-size:32px; font-weight:bold; letter-spacing:8px; color:#111827;">
                      {{otp_code}}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#4b5563;">
                Mã này sẽ hết hạn sau <strong>{{expire_minutes}} phút</strong>.
              </p>

              <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#4b5563;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ bộ phận hỗ trợ ngay lập tức.
              </p>

              <p style="margin:24px 0 0; font-size:15px; line-height:22px;">
                Trân trọng,<br />
                <strong>{{company_name}}</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 24px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; line-height:18px; color:#6b7280;">
                Đây là email tự động, vui lòng không trả lời email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const resend = API_KEY ? new Resend(API_KEY) : null;

export function isCustomerEmailConfigured(): boolean {
  return Boolean(API_KEY && MAIL_FROM);
}

/** Chỉ cần API key Resend — mail OTP dùng HTML cố định + from support (hoặc MAIL_FROM_PASSWORD_RESET). */
export function canSendPasswordResetEmail(): boolean {
  return Boolean(API_KEY);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Thay {{key}} trong HTML (giá trị escape để an toàn). */
function applyEmailTemplateHtml(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [key, value] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{\\s*${key.replace(/[^a-zA-Z0-9_]/g, "")}\\s*\\}\\}`, "g");
    out = out.replace(re, escapeHtml(value));
  }
  return out;
}

function wrapHtml(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:24px 12px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
<tr><td style="padding:24px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);">
<p style="margin:0;color:#e0e7ff;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Mavryk Premium</p>
<h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">${escapeHtml(title)}</h1>
</td></tr>
<tr><td style="padding:28px;color:#e2e8f0;font-size:15px;line-height:1.6;">${inner}</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #334155;color:#94a3b8;font-size:12px;">
Bạn nhận được email này vì có giao dịch / thao tác trên ${escapeHtml(FRONTEND_URL)}.
</td></tr></table></td></tr></table></body></html>`;
}

async function sendMail(options: { from?: string; to: string; subject: string; html: string }): Promise<void> {
  if (!resend) {
    logger.warn("[customer-email] Bỏ qua gửi mail: SEND_MAIL_API_KEY chưa cấu hình");
    return;
  }
  const { data, error } = await resend.emails.send({
    from: options.from ?? MAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  if (error) {
    logger.error("[customer-email] Resend error:", error.message);
    throw new Error(error.message);
  }
  logger.info("[customer-email] Đã gửi", { to: options.to, id: data?.id });
}

/** Thông báo đã đổi email đăng nhập (gửi tới email mới). */
export async function sendEmailUpdatedNotice(params: {
  to: string;
  username: string;
  newEmail: string;
  oldEmail?: string;
}): Promise<void> {
  const { to, username, newEmail, oldEmail } = params;
  const inner = `
<p>Xin chào <strong>${escapeHtml(username)}</strong>,</p>
<p>Email đăng nhập của tài khoản bạn đã được cập nhật thành <strong>${escapeHtml(newEmail)}</strong>.</p>
${oldEmail ? `<p>Email trước đó: ${escapeHtml(oldEmail)}</p>` : ""}
<p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ hỗ trợ ngay.</p>
`;
  await sendMail({
    to,
    subject: "[Mavryk Premium] Email tài khoản đã được cập nhật",
    html: wrapHtml("Cập nhật email", inner),
  });
}

/** Mã OTP quên mật khẩu (hiệu lực ngắn, không chuyển tiếp). */
export async function sendPasswordResetOtp(params: {
  to: string;
  username: string;
  otp: string;
}): Promise<void> {
  const { to, username, otp } = params;
  const vars = {
    user_name: username,
    otp_code: otp,
    expire_minutes: String(PASSWORD_RESET_OTP_EXPIRE_MINUTES),
    company_name: COMPANY_NAME,
    logo_url: PASSWORD_RESET_EMAIL_LOGO_URL,
  };
  const html = applyEmailTemplateHtml(PASSWORD_RESET_OTP_EMAIL_HTML, vars);
  await sendMail({
    to,
    subject: `[${COMPANY_NAME}] Mã xác thực OTP`,
    html,
    from: PASSWORD_RESET_FROM,
  });
}

/** Thanh toán / tạo đơn thành công (sau khi order_customer đã PAID). */
export async function sendOrderPaymentSuccessEmail(params: {
  to: string;
  username: string;
  orderIds: string[];
  totalAmount: number;
  paymentMethod: string;
}): Promise<void> {
  const { to, username, orderIds, totalAmount, paymentMethod } = params;
  const list = orderIds.map((id) => `<li><code>${escapeHtml(id)}</code></li>`).join("");
  const inner = `
<p>Xin chào <strong>${escapeHtml(username)}</strong>,</p>
<p>Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý.</p>
<ul style="padding-left:20px;">${list}</ul>
<p><strong>Tổng thanh toán:</strong> ${escapeHtml(String(totalAmount))} Mcoin &nbsp;·&nbsp; <strong>Hình thức:</strong> ${escapeHtml(paymentMethod)}</p>
<p>Xem chi tiết tại <a href="${escapeHtml(FRONTEND_URL)}/profile?tab=orders" style="color:#818cf8;">Tài khoản → Đơn hàng</a>.</p>
`;
  await sendMail({
    to,
    subject: `[Mavryk Premium] Đã nhận thanh toán (${orderIds.length} đơn)`,
    html: wrapHtml("Thanh toán thành công", inner),
  });
}

/** Bot / hệ thống đã bàn giao (notify-done) — đơn chuyển trạng thái hoàn tất giao dịch. */
export async function sendOrderFulfilledEmail(params: {
  to: string;
  username: string;
  idOrder: string;
  slot?: string | null;
  infoSnippet?: string | null;
}): Promise<void> {
  const { to, username, idOrder, slot, infoSnippet } = params;
  const inner = `
<p>Xin chào <strong>${escapeHtml(username)}</strong>,</p>
<p>Đơn <code>${escapeHtml(idOrder)}</code> đã được <strong>hoàn tất bàn giao</strong>.</p>
${slot ? `<p><strong>Slot / thông tin:</strong> ${escapeHtml(slot)}</p>` : ""}
${infoSnippet ? `<p style="white-space:pre-wrap;background:#0f172a;padding:12px;border-radius:8px;">${escapeHtml(infoSnippet)}</p>` : ""}
<p>Chi tiết tại <a href="${escapeHtml(FRONTEND_URL)}/profile?tab=orders" style="color:#818cf8;">Đơn hàng của tôi</a>.</p>
`;
  await sendMail({
    to,
    subject: `[Mavryk Premium] Đơn ${idOrder} đã sẵn sàng`,
    html: wrapHtml("Đơn hàng đã hoàn tất", inner),
  });
}

/**
 * Nhắc gói / đơn sắp đến hạn (gọi từ cron hoặc job khi bạn quét `order_list.expired_at`).
 */
export async function sendOrderExpiringNoticeEmail(params: {
  to: string;
  username: string;
  idOrder: string;
  expireAtLabel: string;
  productHint?: string | null;
}): Promise<void> {
  const { to, username, idOrder, expireAtLabel, productHint } = params;
  const inner = `
<p>Xin chào <strong>${escapeHtml(username)}</strong>,</p>
<p>Gói / đơn <code>${escapeHtml(idOrder)}</code> sắp đến hạn: <strong>${escapeHtml(expireAtLabel)}</strong>.</p>
${productHint ? `<p>${escapeHtml(productHint)}</p>` : ""}
<p>Nếu cần gia hạn hoặc hỗ trợ, vui lòng liên hệ qua website.</p>
<p><a href="${escapeHtml(FRONTEND_URL)}/profile?tab=orders" style="color:#818cf8;">Xem đơn hàng</a></p>
`;
  await sendMail({
    to,
    subject: `[Mavryk Premium] Nhắc: đơn ${idOrder} sắp hết hạn`,
    html: wrapHtml("Sắp đến hạn", inner),
  });
}

/** Thông báo hoàn tiền (gọi khi nghiệp vụ hoàn tiền xác nhận xong). */
export async function sendOrderRefundNoticeEmail(params: {
  to: string;
  username: string;
  idOrder: string;
  amountLabel: string;
  reason?: string | null;
}): Promise<void> {
  const { to, username, idOrder, amountLabel, reason } = params;
  const inner = `
<p>Xin chào <strong>${escapeHtml(username)}</strong>,</p>
<p>Đơn <code>${escapeHtml(idOrder)}</code> đã được <strong>hoàn tiền</strong> (${escapeHtml(amountLabel)}).</p>
${reason ? `<p>Lý do / ghi chú: ${escapeHtml(reason)}</p>` : ""}
<p>Số dư Mcoin sẽ được cập nhật theo hệ thống. Chi tiết trong lịch sử ví / đơn hàng.</p>
`;
  await sendMail({
    to,
    subject: `[Mavryk Premium] Hoàn tiền đơn ${idOrder}`,
    html: wrapHtml("Hoàn tiền", inner),
  });
}
