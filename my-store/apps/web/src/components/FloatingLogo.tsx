'use client';

import { useState, useEffect } from 'react';

import { MessageCircle, PhoneCall, Send, X } from 'lucide-react';

import ContactMessageBlock from '@/components/ContactMessageBlock';
import { BRANDING_ASSETS } from '@/lib/brandingAssets';

const actions = [
  {
    label: 'Telegram',
    hint: 'Nhắn Telegram hỗ trợ nhanh',
    bg: '#229ED9',
    icon: Send,
    href: 'https://t.me/hung_culi',
  },
  {
    label: 'Messenger',
    hint: 'Chat Messenger với cửa hàng',
    bg: '#0084FF',
    icon: MessageCircle,
    href: 'https://m.me/cyrusdemons',
  },
  {
    label: 'Zalo',
    hint: 'Liên hệ Zalo tư vấn mua hàng',
    bg: '#0068FF',
    icon: PhoneCall,
    href: 'https://zalo.me/0378304963',
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
        className={`fixed right-4 bottom-20 z-50 hidden justify-end pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] transition-all duration-500 ease-out sm:right-6 sm:bottom-24 sm:flex ${
          bannerVisible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <ContactMessageBlock expanded={open} onClick={() => setOpen(true)} />
      </div>

      {/* Icon logo: cố định góc phải dưới */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] sm:right-6 sm:bottom-6">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-center gap-2 transition-all duration-300 ${
                open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: open ? `${idx * 40}ms` : '0ms' }}
              aria-label={action.hint}
            >
              <div className="hidden rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-right shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur sm:block dark:border-slate-700/70 dark:bg-slate-900/92">
                <span className="block text-[10px] font-bold tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                  {action.label}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {action.hint}
                </span>
              </div>

              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
                style={{ backgroundColor: action.bg }}
              >
                <Icon className="h-5 w-5" />
              </span>
            </a>
          );
        })}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-12 min-h-12 w-auto min-w-12 max-w-[11rem] shrink-0 items-center justify-center rounded-full bg-white px-2 shadow-lg ring-1 ring-black/5 transition hover:scale-105 active:scale-95 sm:h-14 sm:min-h-14 sm:max-w-[12rem] sm:px-2.5"
            aria-label="Toggle liên hệ"
          >
            {open ? (
              <X className="h-6 w-6 text-gray-800" />
            ) : (
              <img
                src={BRANDING_ASSETS.logoTransparent}
                alt="Logo"
                title="Mavryk Premium Store"
                width={160}
                height={48}
                className="h-9 max-h-9 w-auto max-w-full object-contain object-center sm:h-11 sm:max-h-11"
              />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
