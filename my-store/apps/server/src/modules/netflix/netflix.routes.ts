import express from "express";

const router = express.Router();

const DEFAULT_COOLDOWN_SECONDS = 30;
const OTP_ACCESS_CODE = "mvrk01";
const UPSTREAM_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

const stripHtml = (value: string | undefined) =>
  (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

function normalizeHouseholdMessage(message: string) {
  const text = stripHtml(message);

  if (!text) return "";

  if (/no recent email found from this address/i.test(text)) {
    return "Không tìm thấy email gần đây từ địa chỉ này.";
  }

  return text
    .replace(/^error:\s*/i, "")
    .replace(/^success:\s*/i, "")
    .trim();
}

function normalizeOtpMessage(message: string) {
  const text = stripHtml(message);

  if (!text) return "";

  if (/this email is not assigned to you/i.test(text)) {
    return "Email này không được gán cho mã truy cập hiện tại.";
  }

  if (/the access code is invalid/i.test(text)) {
    return "Mã truy cập không hợp lệ.";
  }

  return text
    .replace(/^error:\s*/i, "")
    .replace(/^warning:\s*/i, "")
    .trim();
}

async function postUpstreamForm(url: string, body: Record<string, string>) {
  return fetch(url, {
    method: "POST",
    headers: UPSTREAM_HEADERS,
    body: new URLSearchParams(body).toString(),
  });
}

// POST /api/netflix/household
router.post("/household", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();

  if (!email) {
    res.status(400).json({ ok: false, error: "Missing email" });
    return;
  }

  try {
    const upstreamRes = await postUpstreamForm(
      "https://vivarocky.in/household.php",
      { email, user_email: email },
    );

    const html = await upstreamRes.text();

    console.log("[netflix] household status:", upstreamRes.status);
    console.log("[netflix] household headers:", Object.fromEntries(upstreamRes.headers.entries()));
    console.log("[netflix] household HTML:", html.substring(0, 2000));

    const linkMatch =
      html.match(/href=["'](https?:\/\/[^"']*household[^"']*)["']/i) ||
      html.match(/href=["'](https?:\/\/[^"']*netflix[^"']*)["']/i) ||
      html.match(/window\.location\.href\s*=\s*["'](https?:\/\/[^"']+)["']/i);

    const successMatch = html.match(
      /<div[^>]*class=["'][^"']*success[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    const resultMatch = html.match(
      /<div[^>]*class=["'][^"']*result[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    const errorMatch = html.match(
      /<div[^>]*class=["'][^"']*error[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );

    if (linkMatch?.[1]) {
      res.json({
        ok: true,
        link: linkMatch[1],
        message: successMatch
          ? normalizeHouseholdMessage(successMatch[1] ?? "")
          : "Đã tìm thấy liên kết hộ gia đình.",
        cooldown: DEFAULT_COOLDOWN_SECONDS,
      });
      return;
    }

    if (successMatch) {
      res.json({
        ok: true,
        message: normalizeHouseholdMessage(successMatch[1] ?? ""),
        cooldown: DEFAULT_COOLDOWN_SECONDS,
      });
      return;
    }

    if (resultMatch) {
      const text = normalizeHouseholdMessage(resultMatch[1] ?? "");
      const isError = /lỗi|error|not found|không tìm/i.test(text);

      res.json({
        ok: !isError,
        message: text,
        cooldown: DEFAULT_COOLDOWN_SECONDS,
      });
      return;
    }

    if (errorMatch) {
      res.json({
        ok: false,
        message: normalizeHouseholdMessage(errorMatch[1] ?? ""),
        cooldown: DEFAULT_COOLDOWN_SECONDS,
      });
      return;
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyText = stripHtml(bodyMatch[1]);
      const isError = /lỗi|error|không tìm|not found|no.*email|fail/i.test(bodyText);
      const msgMatch = bodyText.match(/((?:Lỗi|Error|Thành công|Success)[^.!]*[.!]?)/i);

      res.json({
        ok: !isError,
        message: msgMatch
          ? normalizeHouseholdMessage(msgMatch[1] ?? "")
          : isError
            ? "Không tìm thấy email gần đây từ địa chỉ này."
            : "Đã xử lý thành công.",
        cooldown: DEFAULT_COOLDOWN_SECONDS,
      });
      return;
    }

    res.json({
      ok: false,
      message: "Không thể xử lý phản hồi từ server.",
      cooldown: DEFAULT_COOLDOWN_SECONDS,
    });
  } catch (err) {
    console.error("[netflix] household proxy error:", err);
    res.status(500).json({ ok: false, error: "Không thể kết nối đến server." });
  }
});

// POST /api/netflix/send-otp
router.post("/send-otp", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();

  if (!email) {
    res.status(400).json({ ok: false, error: "Missing email" });
    return;
  }

  try {
    const upstreamRes = await postUpstreamForm(
      "https://vivarocky.in/signin_code.php",
      { user_email: email, access_code: OTP_ACCESS_CODE },
    );

    const html = await upstreamRes.text();

    console.log("[netflix] send-otp status:", upstreamRes.status);
    console.log("[netflix] send-otp headers:", Object.fromEntries(upstreamRes.headers.entries()));
    console.log("[netflix] send-otp HTML:", html.substring(0, 3000));

    const warningMatch = html.match(
      /<div[^>]*class=["'][^"']*access-warning[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    const errorMatch = html.match(
      /<div[^>]*class=["'][^"']*error[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    const otpMatch =
      html.match(/class=["'][^"']*lrg-number[^"']*["'][^>]*>\s*([0-9]{4,8})\s*</i) ||
      html.match(/Nhập mã này để đăng nhập[\s\S]{0,500}?>([0-9]{4,8})\s*<\/td>/i);
    const subjectMatch = html.match(/<h3>\s*Subject:\s*([\s\S]*?)<\/h3>/i);
    const fromMatch = html.match(/<p>\s*<strong>\s*From:\s*<\/strong>\s*([\s\S]*?)<\/p>/i);
    const dateMatch = html.match(/<p>\s*<strong>\s*Date:\s*<\/strong>\s*([\s\S]*?)<\/p>/i);

    if (otpMatch?.[1]) {
      res.json({
        ok: true,
        code: otpMatch[1].trim(),
        subject: stripHtml(subjectMatch?.[1]),
        from: stripHtml(fromMatch?.[1]),
        date: stripHtml(dateMatch?.[1]),
        message: `Đã lấy mã OTP mới nhất cho ${email}.`,
      });
      return;
    }

    if (warningMatch) {
      res.json({
        ok: false,
        message: normalizeOtpMessage(warningMatch[1] ?? ""),
      });
      return;
    }

    if (errorMatch) {
      res.json({
        ok: false,
        message: normalizeOtpMessage(errorMatch[1] ?? ""),
      });
      return;
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyText = stripHtml(bodyMatch[1]);

      if (/this email is not assigned to you/i.test(bodyText)) {
        res.json({
          ok: false,
          message: "Email này không được gán cho mã truy cập hiện tại.",
        });
        return;
      }

      if (/the access code is invalid/i.test(bodyText)) {
        res.json({
          ok: false,
          message: "Mã truy cập không hợp lệ.",
        });
        return;
      }
    }

    res.json({
      ok: false,
      message: "Không thể lấy mã OTP từ phản hồi của server.",
    });
  } catch (err) {
    console.error("[netflix] send-otp proxy error:", err);
    res.status(500).json({ ok: false, error: "Không thể kết nối đến server OTP." });
  }
});

export default router;
