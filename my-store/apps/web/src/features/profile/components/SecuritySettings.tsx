"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, changeEmail, getSessions, revokeSession } from "@/lib/api";
import type { UserSessionDto } from "@/lib/api";
import { Monitor, Trash2, Loader2, Check, AlertCircle } from "lucide-react";

function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SecuritySettings() {
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: async () => {
      const res = await getSessions();
      if (!res.success || !res.sessions) return [];
      return res.sessions as UserSessionDto[];
    },
  });
  const sessions: UserSessionDto[] = sessionsData ?? [];
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordMessage({ type: "error", text: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }
    setPasswordLoading(true);
    const res = await changePassword({
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    });
    setPasswordLoading(false);
    if (res.success) {
      setPasswordMessage({ type: "success", text: res.message ?? "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage({ type: "error", text: res.error ?? "Đổi mật khẩu thất bại." });
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    if (!newEmail.trim() || !emailPassword) {
      setEmailMessage({ type: "error", text: "Vui lòng nhập email mới và mật khẩu." });
      return;
    }
    setEmailLoading(true);
    const res = await changeEmail({
      newEmail: newEmail.trim(),
      password: emailPassword,
    });
    setEmailLoading(false);
    if (res.success) {
      setEmailMessage({ type: "success", text: res.message ?? "Cập nhật email thành công." });
      setNewEmail("");
      setEmailPassword("");
    } else {
      setEmailMessage({ type: "error", text: res.error ?? "Cập nhật email thất bại." });
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    setRevokingId(sessionId);
    const res = await revokeSession(sessionId);
    setRevokingId(null);
    if (res.success) {
      await queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    }
  };

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mật khẩu và bảo mật</h2>

      {/* Đổi mật khẩu */}
      <section className="max-w-md space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Ít nhất 8 ký tự, có chữ hoa, chữ thường và số"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </div>
          {passwordMessage && (
            <p
              className={`flex items-center gap-2 text-sm ${
                passwordMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {passwordMessage.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {passwordMessage.type === "success" && <Check className="h-4 w-4 flex-shrink-0" />}
              {passwordMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Đổi mật khẩu
          </button>
        </form>
      </section>

      {/* Đổi email */}
      <section className="max-w-md space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Đổi email</h3>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Email mới</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Xác nhận bằng mật khẩu"
              autoComplete="current-password"
            />
          </div>
          {emailMessage && (
            <p
              className={`flex items-center gap-2 text-sm ${
                emailMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {emailMessage.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {emailMessage.type === "success" && <Check className="h-4 w-4 flex-shrink-0" />}
              {emailMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={emailLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
          >
            {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Cập nhật email
          </button>
        </form>
      </section>

      {/* Phiên đăng nhập */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">Phiên đăng nhập</h3>
        {sessionsLoading ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Không có phiên nào.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Monitor className="h-5 w-5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{s.device || "Thiết bị"}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {s.ipAddress && <span>{s.ipAddress} · </span>}
                      Đăng nhập {formatDateTime(s.createdAt)} · Hết hạn {formatDateTime(s.expiresAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeSession(s.id)}
                  disabled={revokingId === s.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
                >
                  {revokingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Thu hồi
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
