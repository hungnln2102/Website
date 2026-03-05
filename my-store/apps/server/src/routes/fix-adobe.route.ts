import express from "express";

const router = express.Router();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
// Gửi mã OTP đến email Adobe của user
router.post("/send-otp", async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  try {
    const upstreamRes = await fetch("https://activate.mkvest.com/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: new URLSearchParams({ email }).toString(),
    });

    const text = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json; charset=utf-8";

    res.status(upstreamRes.status).set("content-type", contentType).send(text);
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
    const upstreamRes = await fetch("https://activate.mkvest.com/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: new URLSearchParams({ email, otp }).toString(),
    });

    const text = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json; charset=utf-8";

    res.status(upstreamRes.status).set("content-type", contentType).send(text);
  } catch (err) {
    console.error("[fix-adobe] verify-otp proxy error:", err);
    res.status(500).json({ error: "Failed to contact OTP verification service" });
  }
});

export default router;
