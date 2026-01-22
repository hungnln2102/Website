"use client";

import { useState } from "react";

import { MessageCircle, PhoneCall, Send, X } from "lucide-react";

import logo from "@/asset/logo.png";

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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <a
            key={action.label}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 ${
              open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
            }`}
            style={{ backgroundColor: action.bg, transitionDelay: open ? `${idx * 40}ms` : "0ms" }}
            aria-label={action.label}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 active:scale-95"
        aria-label="Toggle liên hệ"
      >
        {open ? (
          <X className="h-6 w-6 text-gray-800" />
        ) : (
          <img src={logo} alt="Logo" className="h-12 w-12 rounded-full object-contain" />
        )}
      </button>
    </div>
  );
}
