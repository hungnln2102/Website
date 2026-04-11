import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../modules/maintenance/maintenance.service", () => ({
  isMaintenanceMode: vi.fn(),
  isWhitelisted: vi.fn(),
}));

vi.mock("./security/banned-ip", () => ({
  getClientIP: vi.fn(),
}));

import { maintenanceGuard } from "./maintenance";
import {
  isMaintenanceMode,
  isWhitelisted,
} from "../../modules/maintenance/maintenance.service";
import { getClientIP } from "./security/banned-ip";

type MockRes = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function createRes(): MockRes {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as MockRes;
  res.status.mockReturnValue(res);
  return res;
}

describe("maintenanceGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClientIP).mockReturnValue("8.8.8.8");
    vi.mocked(isMaintenanceMode).mockResolvedValue(true);
    vi.mocked(isWhitelisted).mockResolvedValue(false);
  });

  it("cho qua khi maintenance OFF", async () => {
    vi.mocked(isMaintenanceMode).mockResolvedValue(false);
    const next = vi.fn();
    const req = { path: "/api/payment/create" } as any;
    const res = createRes() as any;

    await maintenanceGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("khong chan route Trung tam goi (renew-adobe public)", async () => {
    const next = vi.fn();
    const req = { path: "/api/renew-adobe/public/profile" } as any;
    const res = createRes() as any;

    await maintenanceGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(isWhitelisted).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("khong chan categories/products/health khi maintenance", async () => {
    const next = vi.fn();
    const res = createRes() as any;

    await maintenanceGuard({ path: "/categories" } as any, res, next);
    await maintenanceGuard({ path: "/products/MAVL" } as any, res, next);
    await maintenanceGuard({ path: "/health/ready" } as any, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("tra 503 cho route khong bypass khi maintenance ON", async () => {
    const next = vi.fn();
    const req = { path: "/api/payment/create" } as any;
    const res = createRes() as any;

    await maintenanceGuard(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "SERVICE_UNAVAILABLE",
        maintenance: true,
      }),
    );
  });

  it("cho qua localhost ngay ca khi maintenance ON", async () => {
    vi.mocked(getClientIP).mockReturnValue("127.0.0.1");
    const next = vi.fn();
    const req = { path: "/api/payment/create" } as any;
    const res = createRes() as any;

    await maintenanceGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(isWhitelisted).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("cho qua IP da whitelist", async () => {
    vi.mocked(isWhitelisted).mockResolvedValue(true);
    const next = vi.fn();
    const req = { path: "/api/payment/create" } as any;
    const res = createRes() as any;

    await maintenanceGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("fail-open neu loi khi check maintenance", async () => {
    vi.mocked(isMaintenanceMode).mockRejectedValue(new Error("db down"));
    const next = vi.fn();
    const req = { path: "/api/payment/create" } as any;
    const res = createRes() as any;

    await maintenanceGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
