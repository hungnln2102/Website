import { roundToNearestThousand } from "@/lib/pricing";

export const formatCurrency = (value: number) =>
  `${roundToNearestThousand(value).toLocaleString("vi-VN")} đ`;

export const normalizePackageKey = (value?: string | null) => (value ?? "").trim().toLowerCase();

export interface DurationToken {
  key: string;
  label: string;
  sortValue: number;
}

export const parseDurationToken = (value?: string | null): DurationToken | null => {
  const text = value ?? "";
  const match = text.match(/--\s*(\d+)\s*([md])\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = match[2].toLowerCase();
  const label = unit === "d" ? `${amount} ngày` : `${amount} tháng`;
  const sortValue = unit === "d" ? amount / 30 : amount;
  return { key: `${amount}${unit}`, label, sortValue };
};

export const isNewPackage = (createdAt: string | null | undefined): boolean => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
};
