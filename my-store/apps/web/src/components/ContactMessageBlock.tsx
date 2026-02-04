"use client";

interface ContactMessageBlockProps {
  onClick?: () => void;
  expanded?: boolean;
}

export default function ContactMessageBlock({ onClick, expanded }: ContactMessageBlockProps) {
  if (expanded) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="chat-bubble group flex items-center gap-2 px-3 py-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      aria-label="Liên hệ với chúng tôi"
    >
      <span className="text-left text-xs font-medium text-slate-800">
        Liên hệ với chúng tôi tại đây
      </span>
    </button>
  );
}
