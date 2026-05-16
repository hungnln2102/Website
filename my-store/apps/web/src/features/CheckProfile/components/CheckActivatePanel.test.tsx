import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckActivatePanel } from "./CheckActivatePanel";

const baseProps = {
  isCheckMode: true,
  email: "user@example.com",
  onEmailChange: vi.fn(),
  loading: false,
  activating: false,
  resultType: "error" as const,
  message: "Tài khoản lỗi đồng bộ Adobe.",
  profileName: null,
  canRenewOnError: false,
  onCheckSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
  onActivate: vi.fn(),
  onSwitchToOtp: vi.fn(),
};

describe("CheckActivatePanel", () => {
  it("hiển thị nút gia hạn khi account lỗi có thể renew", () => {
    render(
      <CheckActivatePanel
        {...baseProps}
        canRenewOnError
      />,
    );

    expect(
      screen.getByRole("button", { name: /gia hạn ngay/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /kiểm tra profile/i }),
    ).not.toBeInTheDocument();
  });

  it("giữ nút kiểm tra cho lỗi không renew được", () => {
    render(<CheckActivatePanel {...baseProps} />);

    expect(
      screen.getByRole("button", { name: /kiểm tra profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /gia hạn ngay/i }),
    ).not.toBeInTheDocument();
  });
});
