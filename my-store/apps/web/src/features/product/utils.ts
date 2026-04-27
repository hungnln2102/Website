import { roundToNearestThousand } from "@/lib/pricing";

export const formatCurrency = (value: number) =>
  `${roundToNearestThousand(value).toLocaleString("vi-VN")} đ`;

/** Giá = 0 thì hiển thị "Liên Hệ", còn lại format tiền. */
export const formatPriceOrContact = (value: number) =>
  value === 0 ? "Liên Hệ" : formatCurrency(value);

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

/** Khóa thời hạn thống nhất với DurationSelector / hàng variant đang chọn (kể cả khi display_name không khớp regex `-- N m`) */
export function packageVariantDurationKey(
  idProduct: string | null | undefined,
  rowIndex: number
): string {
  const duration = parseDurationToken(idProduct);
  if (duration) return duration.key;
  const raw = idProduct?.trim();
  if (raw) return raw;
  return `opt-${rowIndex}`;
}

type DurationKeyOption = {
  key: string;
  label: string;
  id?: string | number;
  id_product?: string | null;
};

/**
 * Gắn `selectedDuration` (từ URL / state) với `option.key` thực tế: tránh mất `matched` khi
 * URL cũ (`1m`) lệch với `id_product` thô (vd. "1 tháng") hoặc label ≠ key.
 */
export function resolveDurationOptionKey(
  selectedKey: string | null,
  options: DurationKeyOption[]
): string | null {
  if (selectedKey == null || !options.length) return selectedKey;
  const selectedTrim = selectedKey.trim();
  if (options.some((o) => o.key === selectedTrim)) return selectedTrim;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const s = norm(selectedTrim);
  const byLabel = options.find((o) => norm(o.label) === s);
  if (byLabel) return byLabel.key;
  for (const o of options) {
    const t = o.id_product?.trim();
    if (t && norm(t) === s) return o.key;
  }
  for (const o of options) {
    if (o.id_product) {
      const fromParse = parseDurationToken(o.id_product);
      if (fromParse && fromParse.key === s) return o.key;
    }
  }
  const mSpaced = s.match(/^(\d+)\s*m$/i);
  if (mSpaced) {
    const alt = `${mSpaced[1]}m`;
    if (options.some((o) => o.key === alt)) return alt;
  }
  return selectedKey;
}

export const isNewPackage = (createdAt: string | null | undefined): boolean => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
};
