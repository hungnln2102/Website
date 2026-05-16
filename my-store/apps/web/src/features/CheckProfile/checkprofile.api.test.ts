import { afterEach, describe, expect, it, vi } from "vitest";
import { checkFixAdesPublicApi } from "./checkprofile.api";

vi.mock("@/lib/api", () => ({
  getApiBase: () => "https://example.test",
}));

describe("checkFixAdesPublicApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trả type=error khi status từ Fix Ades là error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: { status: "error", message: "Tài khoản đang lỗi đồng bộ." },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("phamquynhtrang06@gmail.com");

    expect(result.type).toBe("error");
    expect(result.message).toContain("Tài khoản đang lỗi đồng bộ.");
  });

  it("trả type=expired khi status inactive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: { status: "inactive", teamName: "Team Alpha" },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("inactive@example.com");

    expect(result.type).toBe("expired");
    expect(result.profileName).toBe("Team Alpha");
  });
});
