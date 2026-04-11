/**
 * Access log (HTTP middleware) — production mặc định ít ồn, không log body.
 *
 * Biến: `HTTP_ACCESS_LOG` = `all` | `errors` | `off`
 * - Mặc định: development/test → `all`; production → `errors` (chỉ dòng response khi status ≥ 400).
 */
const modeRaw = (process.env.HTTP_ACCESS_LOG ?? "").trim().toLowerCase();

export type HttpAccessLogMode = "all" | "errors" | "off";

function resolvedMode(): HttpAccessLogMode {
  if (modeRaw === "all" || modeRaw === "errors" || modeRaw === "off") {
    return modeRaw;
  }
  return process.env.NODE_ENV === "production" ? "errors" : "all";
}

const mode = resolvedMode();

export function getHttpAccessLogMode(): HttpAccessLogMode {
  return mode;
}

export function shouldLogRequestLine(): boolean {
  return mode === "all";
}

export function shouldLogResponseLine(statusCode: number): boolean {
  if (mode === "off") return false;
  if (mode === "all") return true;
  return statusCode >= 400;
}
