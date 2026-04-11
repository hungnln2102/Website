import express from "express";

const router = express.Router();
const otpCache = new Map<string, { code: string; expiresAt: number }>();
const OTP_DEBUG_ENABLED =
  String(process.env.FIX_ADOBE_OTP_DEBUG || "").toLowerCase() === "true";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractOtpCode(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw);
  const direct = text.match(/\b(\d{4,8})\b/);
  if (direct?.[1]) return direct[1];
  return null;
}

function collectOtpCandidates(
  input: unknown,
  out: unknown[] = [],
  parentKey = "",
): unknown[] {
  if (input == null) return out;
  if (typeof input === "string") {
    out.push(input);
    return out;
  }
  if (typeof input === "number") {
    if (/otp|code|token|verification|value/i.test(parentKey)) {
      out.push(String(input));
    }
    return out;
  }
  if (Array.isArray(input)) {
    for (const item of input) collectOtpCandidates(item, out, parentKey);
    return out;
  }
  if (typeof input === "object") {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (/otp|code|token|verification/i.test(key)) {
        out.push(value);
      }
      collectOtpCandidates(value, out, key);
    }
  }
  return out;
}

function sanitizeForLog(raw: string, maxLen = 500): string {
  return raw
    .replace(/\b\d{4,8}\b/g, "[otp]")
    .slice(0, maxLen);
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskOtp(code: string): string {
  if (code.length <= 2) return "***";
  return `${code.slice(0, 1)}***${code.slice(-1)}`;
}

function resolveRowsFromPayload(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (data && typeof data === "object") {
    const directRows = (data as { data?: unknown }).data;
    if (Array.isArray(directRows)) return directRows as Array<Record<string, unknown>>;
    const nestedRows = (data as { data?: { rows?: unknown } }).data?.rows;
    if (Array.isArray(nestedRows)) return nestedRows as Array<Record<string, unknown>>;
    const mails = (data as { mails?: unknown }).mails;
    if (Array.isArray(mails)) return mails as Array<Record<string, unknown>>;
  }
  return [];
}

type HdsdOtpResult = {
  code: string;
  service: string;
  timeStr: string | null;
  timestampMs: number | null;
};

function normalizeOtpResult(
  code: string,
  row?: Record<string, unknown>,
): HdsdOtpResult {
  const service = String(row?.service || row?.provider || "unknown").toLowerCase();
  const timestampRaw = row?.timestamp_ms ?? row?.timestamp;
  const parsedTimestamp =
    timestampRaw == null ? Number.NaN : Number.parseInt(String(timestampRaw), 10);
  return {
    code,
    service: service || "unknown",
    timeStr:
      typeof row?.time_str === "string" && row.time_str.trim()
        ? row.time_str.trim()
        : null,
    timestampMs: Number.isFinite(parsedTimestamp) ? parsedTimestamp : null,
  };
}

async function fetchOtpFromHdsd(email: string): Promise<HdsdOtpResult | null> {
  const baseUrl =
    process.env.FIX_ADOBE_OTP_HDSD_BASE_URL ||
    process.env.OTP_HDSD_BASE_URL ||
    "https://otp.hdsd.net";
  const endpoint =
    process.env.FIX_ADOBE_OTP_HDSD_ENDPOINT ||
    "/get_otp_api";
  const token =
    process.env.FIX_ADOBE_OTP_HDSD_TOKEN || process.env.OTP_HDSD_TOKEN || "";

  const url = new URL(endpoint, baseUrl);

  const headers: Record<string, string> = {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeoutMs = Number.parseInt(
    process.env.FIX_ADOBE_OTP_HDSD_TIMEOUT_MS || "10000",
    10,
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });
    const rawText = await response.text();
    if (!response.ok) {
      if (OTP_DEBUG_ENABLED) {
        console.warn("[fix-adobe] hdsd non-OK response", {
          status: response.status,
          email: maskEmail(email),
          body: sanitizeForLog(rawText),
        });
      }
      return null;
    }

    let data: Record<string, unknown> | null = null;
    if (rawText) {
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        data = null;
      }
    }

    const rows = resolveRowsFromPayload(data);
    if (rows.length > 0) {
      // Ưu tiên OTP từ Adobe.
      for (const row of rows) {
        const service = String(row?.service || row?.provider || "").toLowerCase();
        const type = String(row?.type || row?.kind || "").toLowerCase();
        if (service.includes("adobe") && type !== "warning" && type !== "link") {
          const code = extractOtpCode(row?.value ?? row?.otp ?? row?.code);
          if (code) return normalizeOtpResult(code, row);
        }
      }
      // Fallback: dòng hợp lệ bất kỳ có mã số.
      for (const row of rows) {
        const type = String(row?.type || row?.kind || "").toLowerCase();
        if (type === "warning" || type === "link") continue;
        const code = extractOtpCode(row?.value ?? row?.otp ?? row?.code);
        if (code) return normalizeOtpResult(code, row);
      }
    }

    const candidates = collectOtpCandidates(data ?? rawText);
    for (const candidate of candidates) {
      const code = extractOtpCode(candidate);
      if (code) {
        return {
          code,
          service: "unknown",
          timeStr: null,
          timestampMs: null,
        };
      }
    }

    if (OTP_DEBUG_ENABLED) {
      console.info("[fix-adobe] hdsd no otp in payload", {
        email: maskEmail(email),
        body: sanitizeForLog(rawText),
      });
    }
    return null;
  } catch (error) {
    console.error("[fix-adobe] fetchOtpFromHdsd error:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type FetchOtpOptions = {
  attempts?: number;
  intervalMs?: number;
};

async function fetchOtpFromHdsdWithRetry(
  email: string,
  options?: FetchOtpOptions,
): Promise<HdsdOtpResult | null> {
  const attempts = Math.max(
    1,
    Number.parseInt(
      String(
        options?.attempts ??
          process.env.FIX_ADOBE_OTP_HDSD_POLL_ATTEMPTS ??
          "4",
      ),
      10,
    ) || 1,
  );
  const intervalMs = Math.max(
    0,
    Number.parseInt(
      String(
        options?.intervalMs ??
          process.env.FIX_ADOBE_OTP_HDSD_POLL_INTERVAL_MS ??
          "2500",
      ),
      10,
    ) || 0,
  );

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const otpResult = await fetchOtpFromHdsd(email);
    if (otpResult) {
      if (OTP_DEBUG_ENABLED) {
        console.info("[fix-adobe] hdsd otp resolved", {
          email: maskEmail(email),
          attempt,
          attempts,
          code: maskOtp(otpResult.code),
          service: otpResult.service,
        });
      }
      return otpResult;
    }
    if (OTP_DEBUG_ENABLED) {
      console.info("[fix-adobe] hdsd retry waiting", {
        email: maskEmail(email),
        attempt,
        attempts,
        intervalMs,
      });
    }
    if (attempt < attempts && intervalMs > 0) {
      await sleep(intervalMs);
    }
  }

  return null;
}

// POST /api/fix-adobe/check-profile
router.post("/check-profile", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  try {
    const upstreamRes = await fetch("https://check.mkvest.com/check-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const text = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json; charset=utf-8";

    res.status(upstreamRes.status).set("content-type", contentType).send(text);
  } catch (err) {
    console.error("[fix-adobe] check-profile proxy error:", err);
    res.status(500).json({ error: "Failed to contact profile checker" });
  }
});

// POST /api/fix-adobe/switch
// 1) Gọi activate.mkvest.com/switch (form-urlencoded) → lấy taskId từ HTML
// 2) Poll activate.mkvest.com/task/{taskId} cho đến khi status !== "processing"
router.post("/switch", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  try {
    // Bước 1: tạo task
    const switchRes = await fetch("https://activate.mkvest.com/switch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: new URLSearchParams({ email }).toString(),
    });

    const html = await switchRes.text();

    if (!switchRes.ok) {
      res.status(502).json({
        error: "Failed to create activation task",
        upstreamStatus: switchRes.status,
      });
      return;
    }

    // Lấy taskId từ HTML: const taskId = "email_xxx_YYYYMMDDHHmmss";
    const match = html.match(/const\s+taskId\s*=\s*["']([^"']+)["']/);
    if (!match || !match[1]) {
      console.error("[fix-adobe] Cannot parse taskId from HTML:\n", html.slice(0, 500));
      res.status(500).json({ error: "Cannot parse taskId from activation page" });
      return;
    }

    const taskId = match[1];
    const cookie = switchRes.headers.get("set-cookie") ?? undefined;

    console.log(`[fix-adobe] taskId = ${taskId}`);

    // Bước 2: poll status
    const maxAttempts = 40; // 40 × 3s = 2 phút tối đa
    let lastData: unknown = null;

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(3000);

      const taskRes = await fetch(
        `https://activate.mkvest.com/task/${encodeURIComponent(taskId)}`,
        {
          headers: {
            ...(cookie ? { Cookie: cookie } : {}),
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        },
      );

      const text = await taskRes.text();
      try {
        lastData = text ? JSON.parse(text) : null;
      } catch {
        lastData = { raw: text };
      }

      if (!taskRes.ok) {
        res.status(502).json({
          error: "Failed to fetch task status",
          upstreamStatus: taskRes.status,
          data: lastData,
        });
        return;
      }

      const status = String((lastData as any)?.status ?? "").toLowerCase();
      console.log(`[fix-adobe] poll attempt ${i + 1}: status = ${status}`);

      if (status && status !== "processing") {
        res.json(lastData);
        return;
      }
    }

    res.status(504).json({ error: "Activation task timeout", data: lastData ?? null });
  } catch (err) {
    console.error("[fix-adobe] switch proxy error:", err);
    res.status(500).json({ error: "Failed to contact activation service" });
  }
});

// POST /api/fix-adobe/send-otp
// Lấy OTP mới nhất từ otp.hdsd.net (POST /get_otp_api) và poll ngắn nếu OTP về chậm.
router.post("/send-otp", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  try {
    const otpResult = await fetchOtpFromHdsdWithRetry(email);
    if (!otpResult) {
      res.status(404).json({
        success: false,
        message:
          "Chưa lấy được OTP từ otp.hdsd.net. Vui lòng thử lại sau vài giây.",
      });
      return;
    }

    otpCache.set(email.toLowerCase(), {
      code: otpResult.code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    res.json({
      success: true,
      message: `Đã lấy OTP từ otp.hdsd.net cho ${email}.`,
      otp: {
        code: otpResult.code,
        service: otpResult.service,
        time_str: otpResult.timeStr,
        timestamp_ms: otpResult.timestampMs,
      },
    });
  } catch (err) {
    console.error("[fix-adobe] send-otp proxy error:", err);
    res.status(500).json({ error: "Failed to contact OTP service" });
  }
});

// POST /api/fix-adobe/verify-otp
// Xác nhận mã OTP mà user nhập vào
router.post("/verify-otp", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();
  const otp = (req.body?.otp as string | undefined)?.trim();

  if (!email || !otp) {
    res.status(400).json({ error: "Missing email or otp" });
    return;
  }

  try {
    const key = email.toLowerCase();
    const cached = otpCache.get(key);
    const now = Date.now();
    let latestOtp =
      cached && cached.expiresAt > now ? cached.code : null;

    if (!latestOtp) {
      const freshOtp = await fetchOtpFromHdsdWithRetry(email, { attempts: 1 });
      latestOtp = freshOtp?.code ?? null;
      if (latestOtp) {
        otpCache.set(key, {
          code: latestOtp,
          expiresAt: now + 5 * 60 * 1000,
        });
      }
    }

    if (!latestOtp) {
      res.status(404).json({
        success: false,
        message:
          "Không tìm thấy OTP trên otp.hdsd.net để đối chiếu.",
      });
      return;
    }

    if (String(otp).trim() !== String(latestOtp).trim()) {
      res.status(400).json({
        success: false,
        message: "Mã OTP không đúng hoặc đã hết hạn.",
      });
      return;
    }

    otpCache.delete(key);
    res.json({
      success: true,
      status: "success",
      message: "Xác nhận OTP thành công!",
    });
  } catch (err) {
    console.error("[fix-adobe] verify-otp proxy error:", err);
    res.status(500).json({ error: "Failed to contact OTP verification service" });
  }
});

export default router;
