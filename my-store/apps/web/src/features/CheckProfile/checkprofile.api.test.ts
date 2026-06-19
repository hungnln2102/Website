import { afterEach, describe, expect, it, vi } from "vitest";
import { checkFixAdesPublicApi, sendFixAdesOtpApi, switchFixAdesOrganizationApi, syncFixAdesAccountApi } from "./checkprofile.api";

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

  it("maps legacy Renewable/Available Processing account to success flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              email: "sanders.pope.614848@maelstrom.academy",
              status: "Processing",
              productName: "Adobe CCPRO, Renewable Account, 1 Month",
              teamName: "DEL-DataVista Group",
              groupName: "Adobe CCPRO Renew, Available Account",
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("sanders.pope.614848@maelstrom.academy");

    expect(result.type).toBe("check-success");
    expect(result.transferInfo).toBeNull();
  });

  it("maps legacy Direct Email Upgrade Processing account to success flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              email: "hangtt2341994@gmail.com",
              status: "Processing",
              productName: "Adobe, CCPRO+, Email Activation, 3 Month",
              teamName: "Akrio-VisionSphere",
              groupName: "Adobe CCPRO+, Direct Email Upgrade",
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("hangtt2341994@gmail.com");

    expect(result.type).toBe("check-success");
    expect(result.transferInfo).toBeNull();
  });


  it("maps legacy normal Processing account to success flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              email: "hello.thangphan@gmail.com",
              status: "Processing",
              productName: "Adobe CCPRO Active Account",
              teamName: "Normal Team",
              groupName: "Adobe CCPRO Active Account",
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("hello.thangphan@gmail.com");

    expect(result.type).toBe("check-success");
    expect(result.transferInfo).toBeNull();
  });


  it("maps transfer active Personal Profile to success flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              status: 201,
              success: true,
              data: {
                existedInSystem: true,
                transferTeamResponse: {
                  found: true,
                  email: "hello.thangphan@gmail.com",
                  teamName: "Personal Profile",
                  status: "active",
                  switchAvailable: false,
                  switchTargetTeamName: null,
                },
              },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("hello.thangphan@gmail.com");

    expect(result.type).toBe("check-success");
    expect(result.transferInfo).toBeNull();
  });

  it("maps transfer inactive with switch target to transfer flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              status: 201,
              success: true,
              data: {
                existedInSystem: true,
                transferTeamResponse: {
                  found: true,
                  email: "hangtt2341994@gmail.com",
                  teamName: "Akrio-VisionSphere",
                  status: "inactive",
                  switchAvailable: true,
                  switchTargetTeamName: "Personal Profile",
                },
              },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("hangtt2341994@gmail.com");

    expect(result.type).toBe("expired");
    expect(result.transferInfo?.action).toBe("renew");
    expect(result.transferInfo?.currentTeam).toBe("Akrio-VisionSphere");
    expect(result.transferInfo?.targetTeam).toBe("Personal Profile");
  });

  it("maps transfer null response to sync flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              status: 201,
              success: true,
              data: {
                existedInSystem: true,
                transferTeamResponse: null,
              },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkFixAdesPublicApi("sanders.pope.614848@maelstrom.academy");

    expect(result.type).toBe("expired");
    expect(result.transferInfo?.action).toBe("sync");
    expect(result.transferInfo?.showTeams).toBe(false);
  });

});


describe("switchFixAdesOrganizationApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts email to switch-organization and maps success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { token: "token-123" } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 201,
            success: true,
            data: {
              success: true,
              message: "Moved to Personal Profile.",
              newOrganizationName: "Personal Profile",
            },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await switchFixAdesOrganizationApi("vyvy28022002@gmail.com");

    expect(result.type).toBe("activate-success");
    expect(result.profileName).toBe("Personal Profile");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api-2026-02.ades.support/ades-support/switch-organization",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "vyvy28022002@gmail.com" }),
      }),
    );
  });
});


describe("syncFixAdesAccountApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts email to sync-ado-account and maps success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { token: "token-123" } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 201,
            success: true,
            data: {
              success: true,
              message: "Synced successfully.",
            },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncFixAdesAccountApi("thangnguyen.it@koto.com.au");

    expect(result.type).toBe("activate-success");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api-2026-02.ades.support/ades-support/sync-ado-account",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "thangnguyen.it@koto.com.au" }),
      }),
    );
  });
});


describe("sendFixAdesOtpApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets OTP from Ades read-otp-gpm endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 200,
          success: true,
          message: "Fetched successfully",
          data: {
            success: true,
            otp: {
              code: "123456",
              service: "gpm",
              time_str: "2026-06-18 19:00:00",
              timestamp_ms: "1781809200000",
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendFixAdesOtpApi("murray.ford.11874@colegiomontealto.us");

    expect(result.type).toBe("info");
    expect(result.otp?.code).toBe("123456");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-2026-02.ades.support/mail/read-otp-gpm?email=murray.ford.11874%40colegiomontealto.us",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
