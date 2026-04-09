"use client";

import { useState } from "react";
import { User, Receipt, Pencil, X, Check } from "lucide-react";
import { TierProgressBar } from "./TierProgressBar";
import { updateProfile } from "@/lib/api";

/** Còn lại = cycle_end_at - now → "x Ngày hh:mm" */
function formatRemaining(cycleEndAt: string, nowDate: Date): string {
  const end = parseCycleDate(cycleEndAt);
  const ms = end.getTime() - nowDate.getTime();
  if (ms <= 0) return "0 Ngày 00:00";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const remainder = ms % (24 * 60 * 60 * 1000);
  const hours = Math.floor(remainder / (60 * 60 * 1000));
  const minutes = Math.floor((remainder % (60 * 60 * 1000)) / (60 * 1000));
  return `${days} Ngày ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Giá trị cho input type="date" (tránh lệch ngày theo timezone) */
function toDateInputValue(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "";
  const s = String(isoOrDate);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse ngày từ API: "yyyy-mm-dd hh:mm:ss" (VN) hoặc ISO → Date (coi là giờ local khi không có Z) */
function parseCycleDate(s: string): Date {
  if (!s || typeof s !== "string") return new Date(NaN);
  if (s.includes("T") || s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(s.replace(" ", "T"));
}

/** Chu kỳ chỉ lấy từ API (bảng tier_cycles). Kiểm tra object có cycleStartAt, cycleEndAt (string). */
function isValidApiCycle(c: unknown): c is { cycleStartAt: string; cycleEndAt: string } {
  return (
    c != null &&
    typeof c === "object" &&
    typeof (c as any).cycleStartAt === "string" &&
    typeof (c as any).cycleEndAt === "string"
  );
}

type AccountOverviewProps = {
  user: any;
  formatDate: (date: string | null | undefined) => string;
  currentCycleFromApi?: unknown;
  profileLoading?: boolean;
  /** Gọi sau khi cập nhật profile thành công để refetch dữ liệu */
  refetchProfile?: () => void;
};

export function AccountOverview({ user, formatDate, currentCycleFromApi, profileLoading, refetchProfile }: AccountOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName ?? "");
  const [editLastName, setEditLastName] = useState(user?.lastName ?? "");
  const [editDateOfBirth, setEditDateOfBirth] = useState(toDateInputValue(user?.dateOfBirth));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nowDate = user?.serverNow ? new Date(user.serverNow) : new Date();
  const nowMs = nowDate.getTime();
  const dobNextIso = user?.dateOfBirthNextEditableAt as string | undefined | null;
  const dobLockUntilMs = dobNextIso ? new Date(dobNextIso).getTime() : null;
  const dobEditLocked = dobLockUntilMs != null && nowMs < dobLockUntilMs;
  // Chỉ hiển thị chu kỳ khi có dữ liệu từ API (tier_cycles). Không fallback.
  const hasApiCycle = isValidApiCycle(currentCycleFromApi);
  const hasUserCycle = isValidApiCycle(user?.currentCycle);
  const effectiveCycle =
    hasApiCycle
      ? { cycleStartAt: (currentCycleFromApi as any).cycleStartAt, cycleEndAt: (currentCycleFromApi as any).cycleEndAt }
      : hasUserCycle
        ? { cycleStartAt: user.currentCycle.cycleStartAt, cycleEndAt: user.currentCycle.cycleEndAt }
        : null;
  const cycleLoading = profileLoading && !effectiveCycle;
  const noCycleData = !profileLoading && !effectiveCycle;
  const infoCellClass =
    "rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-slate-700/70 dark:bg-slate-800/55 dark:shadow-none";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400";
  const valueClass = "mt-1 text-sm font-bold leading-snug tracking-tight text-slate-900 dark:text-white";
  const nameFieldLabelClass =
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";
  const nameBlockClass =
    "rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-slate-700/70 dark:bg-slate-800/55 dark:shadow-none sm:p-6";
  const nameInputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none ring-blue-500/20 transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-400/80 focus:ring-2 dark:border-slate-600/80 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500/50";

  return (
    <div className="p-6 sm:p-8">
      <h2 className="mb-6 text-xl font-black tracking-tight text-slate-900 dark:text-white">Tổng quan</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7">
        {/* Block 1: Account Info */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/50 dark:shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
          <div className="border-b border-slate-100/90 bg-gradient-to-r from-blue-500/[0.09] via-transparent to-transparent px-5 py-4 dark:border-slate-800/90 dark:from-blue-400/[0.12]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                  <User className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Thông tin tài khoản</h3>
                </div>
              </div>
              {refetchProfile && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaveError(null);
                          const fn = (editFirstName ?? "").trim();
                          const ln = (editLastName ?? "").trim();
                          const dobRaw = (editDateOfBirth ?? "").trim();
                          if (!fn || !ln) {
                            setSaveError("Vui lòng điền đầy đủ họ và tên.");
                            return;
                          }
                          setSaving(true);
                          const res = await updateProfile({
                            firstName: fn,
                            lastName: ln,
                            dateOfBirth: dobRaw,
                          });
                          setSaving(false);
                          if (res.success) {
                            refetchProfile();
                            setIsEditing(false);
                          } else {
                            setSaveError(res.error ?? "Cập nhật thất bại.");
                          }
                        }}
                        disabled={saving}
                        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        <Check className="h-4 w-4" />
                        {saving ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditFirstName(user?.firstName ?? "");
                          setEditLastName(user?.lastName ?? "");
                          setEditDateOfBirth(toDateInputValue(user?.dateOfBirth));
                          setSaveError(null);
                        }}
                        disabled={saving}
                        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed sm:px-4 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <X className="h-4 w-4" />
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditFirstName(user?.firstName ?? "");
                        setEditLastName(user?.lastName ?? "");
                        setEditDateOfBirth(toDateInputValue(user?.dateOfBirth));
                        setSaveError(null);
                        setIsEditing(true);
                      }}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/80 sm:px-4 sm:text-sm dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className={infoCellClass}>
                <p className={labelClass}>Tên đăng nhập</p>
                <p className={`${valueClass} truncate font-mono text-[13px]`} title="Tên đăng nhập không thể đổi">
                  {user?.username || "N/A"}
                </p>
              </div>
              <div className={infoCellClass}>
                <p className={labelClass}>Email</p>
                <p
                  className={`${valueClass} break-all text-[13px] sm:break-normal sm:truncate`}
                  title="Email không thể đổi tại đây"
                >
                  {user?.email || "N/A"}
                </p>
              </div>
            </div>

            <div className={nameBlockClass}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-0">
                <div className="min-w-0 sm:pr-6">
                  <p className={nameFieldLabelClass}>Họ</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className={nameInputClass}
                      placeholder="Nhập họ"
                      autoComplete="off"
                    />
                  ) : (
                    <p className="mt-2 text-base font-bold capitalize leading-snug tracking-tight text-slate-900 dark:text-white">
                      {user?.firstName || "—"}
                    </p>
                  )}
                </div>
                <div className="min-w-0 border-t border-slate-200/80 pt-5 dark:border-slate-600/50 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                  <p className={nameFieldLabelClass}>Tên</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className={nameInputClass}
                      placeholder="Nhập tên"
                      autoComplete="off"
                    />
                  ) : (
                    <p className="mt-2 text-base font-bold capitalize leading-snug tracking-tight text-slate-900 dark:text-white">
                      {user?.lastName || "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className={infoCellClass}>
                <p className={labelClass}>Ngày sinh</p>
                {isEditing ? (
                  dobEditLocked ? (
                    <div className="mt-1 space-y-1.5">
                      <p className={valueClass}>
                        {user?.dateOfBirth
                          ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
                          : "Chưa cập nhật"}
                      </p>
                      <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
                        Chỉ được đổi ngày sinh một lần mỗi 365 ngày. Có thể chỉnh lại sau{" "}
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {dobNextIso ? formatDate(dobNextIso) : "—"}
                        </span>
                        .
                      </p>
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={editDateOfBirth}
                      onChange={(e) => setEditDateOfBirth(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500/25 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  )
                ) : (
                  <p className={valueClass}>
                    {user?.dateOfBirth
                      ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </p>
                )}
              </div>
              <div className={infoCellClass}>
                <p className={labelClass}>Ngày tham gia</p>
                <p className={`${valueClass} text-[13px] leading-snug`}>{formatDate(user?.createdAt)}</p>
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {saveError}
              </p>
            )}
          </div>
        </div>

        {/* Block 2: Balance & Membership */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/50 dark:shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
          <div className="border-b border-slate-100/90 bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-transparent px-5 py-4 dark:border-slate-800/90 dark:from-emerald-400/[0.1]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                <Receipt className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Số dư &amp; Tích lũy</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bậc hội viên và tiến trình chu kỳ</p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className={infoCellClass}>
                <p className={labelClass}>Số dư</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {(user?.balance ?? 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className={infoCellClass}>
                <p className={labelClass}>Đã tích lũy</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {(user?.totalSpend ?? 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className={infoCellClass}>
                <p className={labelClass}>Bậc hiện tại</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/35 dark:text-amber-300">
                  {user?.customerType || "Member"}
                </span>
              </div>
            </div>

            {/* Khối tiến trình bậc + chu kỳ + thời gian reset */}
            <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/60 dark:bg-slate-800/60">
              <div className="space-y-1.5 border-b border-slate-200 pb-3 dark:border-slate-700/50">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Chu kỳ hiện tại:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {cycleLoading
                      ? "Đang tải..."
                      : noCycleData
                        ? "Chưa có dữ liệu chu kỳ"
                        : effectiveCycle
                          ? `${parseCycleDate(effectiveCycle.cycleStartAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })} - ${parseCycleDate(effectiveCycle.cycleEndAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}`
                          : "—"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Còn lại:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {cycleLoading || noCycleData || !effectiveCycle ? "—" : formatRemaining(effectiveCycle.cycleEndAt, nowDate)}
                  </span>
                </p>
              </div>

              <TierProgressBar
                totalSpend={user?.totalSpend ?? 0}
                currentTier={user?.customerType || "Member"}
                tiers={user?.tiers}
              />
              {(effectiveCycle?.cycleEndAt ?? user?.tierCycleEnd) && (
                <p className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-slate-500 dark:border-slate-700/50 dark:text-slate-400">
                  Reset chu kỳ:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(effectiveCycle?.cycleEndAt ?? user?.tierCycleEnd ?? null)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
