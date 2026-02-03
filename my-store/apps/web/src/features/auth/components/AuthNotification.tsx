"use client";

import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface AuthNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: "success" | "error";
  autoHideDuration?: number;
}

export function AuthNotification({
  message,
  isVisible,
  onClose,
  type = "success",
  autoHideDuration = 3000,
}: AuthNotificationProps) {
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  return (
    <div
      className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ease-out ${
        isVisible
          ? "top-6 opacity-100 translate-y-0"
          : "-top-20 opacity-0 -translate-y-full"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl backdrop-blur-sm ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
        }`}
      >
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
        <span className="font-semibold text-sm whitespace-nowrap">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 rounded-full p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
