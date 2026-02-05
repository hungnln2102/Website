"use client";

import { useState, useEffect } from "react";

import { MessageCircle, PhoneCall, Send, X } from "lucide-react";

import ContactMessageBlock from "@/components/ContactMessageBlock";
import logo from "@/asset/logo1.png";

const actions = [
  {
    label: "Telegram",
    bg: "#229ED9",
    icon: Send,
    href: "https://t.me/hung_culi",
  },
  {
    label: "Messenger",
    bg: "#0084FF",
    icon: MessageCircle,
    href: "https://m.me/cyrusdemons",
  },
  {
    label: "Zalo",
    bg: "#0068FF",
    icon: PhoneCall,
    href: "https://zalo.me/0378304963",
  },
];

export default function FloatingLogo() {
  const [open, setOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  // Ẩn dòng "Liên hệ với chúng tôi" sau 5 giây, giữ logo
  useEffect(() => {
    const timer = setTimeout(() => setBannerVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Bong bóng chat: hiển thị 5s rồi animation ẩn, logo giữ nguyên bên dưới */}
      <div
        className={`fixed bottom-20 right-4 z-50 flex justify-end pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] sm:bottom-24 sm:right-6 transition-all duration-500 ease-out ${
          bannerVisible
            ? "opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-4"
        }`}
      >
        <ContactMessageBlock expanded={open} onClick={() => setOpen(true)} />
      </div>

      {/* Icon logo: cố định góc phải dưới */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] sm:bottom-6 sm:right-6">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <a
            key={action.label}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 sm:h-12 sm:w-12 ${
              open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
            }`}
            style={{ backgroundColor: action.bg, transitionDelay: open ? `${idx * 40}ms` : "0ms" }}
            aria-label={action.label}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
          aria-label="Toggle liên hệ"
        >
        {open ? (
          <X className="h-6 w-6 text-gray-800" />
        ) : (
          <img src={logo} alt="Logo" className="h-9 w-9 rounded-full object-contain sm:h-12 sm:w-12" />
        )}
        </button>
      </div>
    </div>
    </>
  );
}
