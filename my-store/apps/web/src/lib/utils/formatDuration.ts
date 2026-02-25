/**
 * Quy đổi chuỗi thời gian (1m, 30d, 1y) sang tiếng Việt: "1 tháng", "30 ngày", "1 năm".
 */
export function formatDuration(duration: string | undefined | null): string {
  if (!duration || typeof duration !== "string") return "";
  const trimmed = duration.trim();
  const match = trimmed.match(/^(\d+)\s*(d|m|y)$/i);
  if (!match) return trimmed;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === "d") return `${num} ngày`;
  if (unit === "m") return `${num} tháng`;
  if (unit === "y") return `${num} năm`;
  return trimmed;
}
