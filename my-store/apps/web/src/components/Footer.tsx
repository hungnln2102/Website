import { Facebook, Youtube, Mail, MessageCircle } from "lucide-react";
import logo from "@/asset/logo.png";
import { ROUTES } from "@/lib/constants";

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { icon: MessageCircle, href: "#", label: "Zalo" },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-800/80 bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 pt-1 pb-1 sm:px-4 lg:px-4">
        {/* Main row: logo + text | social + email + links */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
          {/* Left: logo + 2 paragraphs — min-w-0 để scale/wrap đúng khi màn hình nhỏ */}
          <div className="min-w-0 max-w-xl">
            <a
              href={ROUTES.home}
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", ROUTES.home);
                window.dispatchEvent(new PopStateEvent("popstate"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mb-2 flex items-center gap-2 text-left transition-opacity hover:opacity-90"
              aria-label="Về trang chủ Mavryk Premium Store"
            >
              <img src={logo} alt="" className="h-7 w-7 rounded-lg bg-white object-contain p-1" />
              <span className="text-base font-bold text-white">
                Mavryk Premium <span className="text-blue-400">Store</span>
              </span>
            </a>
            <p className="text-xs leading-snug text-slate-300 break-words">
              Mavryk Premium Store ra đời với mục đích giúp khách hàng mua key phần mềm bản quyền chính hãng
              một cách nhanh chóng, an toàn và có hỗ trợ sau bán hàng rõ ràng.
            </p>
            <p className="mt-1.5 text-xs leading-snug text-slate-400 break-words">
              Cập nhật đa dạng sản phẩm Windows, Office, Adobe, Autodesk; xử lý đơn nhanh, gửi key qua email
              và đồng hành cùng bạn trong suốt quá trình kích hoạt và sử dụng.
            </p>
          </div>

          {/* Right: social icons + email + policy links */}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/80 text-slate-300 transition-colors hover:bg-blue-500 hover:text-white"
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
            <a
              href="mailto:support@mavrykpremium.store"
              className="flex items-center gap-1.5 text-xs text-slate-300 transition-colors hover:text-blue-400"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              support@mavrykpremium.store
            </a>
            <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto text-xs text-slate-400 [&>*]:whitespace-nowrap">
              <a
                href={ROUTES.home}
                className="transition-colors hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, "", ROUTES.home);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Trang chủ
              </a>
              <span className="text-slate-600">|</span>
              <a
                href={ROUTES.about}
                className="transition-colors hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, "", ROUTES.about);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Giới thiệu
              </a>
              <span className="text-slate-600">|</span>
              <span className="cursor-default whitespace-nowrap">Chính sách bảo hành</span>
              <span className="text-slate-600">|</span>
              <span className="cursor-default whitespace-nowrap">Điều khoản sử dụng</span>
            </div>
          </div>
        </div>

        {/* Bottom: logo + copyright, DMCA — compact */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-slate-800/80 pt-2 pb-[5px] sm:flex-row">
          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <a
              href={ROUTES.home}
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", ROUTES.home);
                window.dispatchEvent(new PopStateEvent("popstate"));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="opacity-80 transition-opacity hover:opacity-100"
              aria-label="Về trang chủ"
            >
            </a>
            <p className="text-center text-[11px] text-slate-500 sm:text-left">
              &copy; {new Date().getFullYear()} Mavryk Premium Store. All rights reserved.
            </p>
          </div>
          <a
            href="//www.dmca.com/Protection/Status.aspx?ID=c788f409-9a7f-422c-9359-bf1582035d73&refurl=https://mavrykpremium.store/&rlo=true"
            title="DMCA.com Protection Status"
            className="transition-opacity hover:opacity-90"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://images.dmca.com/Badges/dmca_protected_sml_120l.png?ID=c788f409-9a7f-422c-9359-bf1582035d73"
              alt="DMCA.com Protection Status"
              className="h-6 object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
