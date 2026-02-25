import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountOverview } from "./AccountOverview";

const formatDate = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A";

describe("AccountOverview – chu kỳ hiện tại", () => {
  it("hiển thị đúng cycleStartAt và cycleEndAt khi có currentCycleFromApi từ API (tier_cycles)", () => {
    const currentCycleFromApi = {
      id: 4,
      cycleStartAt: "2026-01-01 00:00:00",
      cycleEndAt: "2026-07-30 16:59:59",
      status: "OPEN",
    };
    render(
      <AccountOverview
        user={{ serverNow: new Date().toISOString() }}
        formatDate={formatDate}
        currentCycleFromApi={currentCycleFromApi}
        profileLoading={false}
      />
    );
    // API trả 30/07 → phải hiển thị 30/07, không phải 30/06 (client fallback)
    expect(screen.getByText(/01\/01\/2026\s*-\s*30\/07\/2026/)).toBeInTheDocument();
  });

  it("khi profileLoading=true và chưa có API cycle thì hiển thị Đang tải...", () => {
    render(
      <AccountOverview
        user={{ serverNow: new Date().toISOString() }}
        formatDate={formatDate}
        currentCycleFromApi={undefined}
        profileLoading={true}
      />
    );
    expect(screen.getByText("Đang tải...")).toBeInTheDocument();
  });

  it("khi đã load xong mà API không trả currentCycle thì hiển thị Chưa có dữ liệu chu kỳ (không fallback)", () => {
    render(
      <AccountOverview
        user={{ serverNow: new Date().toISOString() }}
        formatDate={formatDate}
        currentCycleFromApi={undefined}
        profileLoading={false}
      />
    );
    expect(screen.getByText("Chưa có dữ liệu chu kỳ")).toBeInTheDocument();
    expect(screen.queryByText(/30\/06\/2026/)).not.toBeInTheDocument();
  });
});
