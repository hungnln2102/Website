import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories, productsQueryKey } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";
import { ChevronLeft, AlertTriangle, Info, CheckCircle2, Youtube } from "lucide-react";

const CC_ICON =
  "https://4216176300-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FoBm1hkWlFGKdeqecZYLv%2Fuploads%2FlyucHFe8F44zjAS0bIeK%2FAdobe_Creative_Cloud_rainbow_icon.svg.png?alt=media&token=2727aae3-5729-4104-a3ac-a4782fee3fbb";

const IMG_LOGIN_SCREEN =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjtPPPmo84OJHRdtygu2wy20a_7GnCuEYRie2mMpUgZ2VUUG2_zo3_Aoz5bsqODzy67zPTVRrRQ2hvSnbtNnQgkkIEQIRKQFvGuz7_yzEh-R4m2iUWyqguN4ofiWHODLI7dhD4XXIQNoTQnSYmnctw7JHBZNdvaS2eo4Wg4-zBmp-4pztr1BYeHx_Ra2J15/s16000/qqqq.jpg";

const IMG_SIGN_OUT =
  "https://4216176300-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FoBm1hkWlFGKdeqecZYLv%2Fuploads%2FOIPXi2gjjiymfg82wy7h%2Fimage.png?alt=media&token=d149163f-aad8-4c22-9dd9-8eeafebdb356";

const IMG_SIGN_IN =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbVFNATdzeoeOqLt9AnFeUMFWNYLtUEMIouS7wpsYbV1gBz0PStEaEhhN9Vh2Tnxa2jdyL5DE0XaW1BPxybtc85PpVL-ZoeJmAVq_CkB8SEp4LnpJkaN-H3t2CE2bSSFtcx-kzTeVwDtAtTdTFHKFSNp_hljcvCDaWHwDUCq7S4YOjJbKGGrNIMKcEf3gt/s16000/a2.png";

const IMG_PASSWORD =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiIeMFsyjH-IMABtjyx1rhPjDkZBKEhuq6uItWI_SaA1BA5JKJgPEd3gxc4GftxFvF9AVSCeh9eDypD2ijGj2TxwrDme6U697nOqINHuiWqRCtQZgI7tycraA5sJDgj1fTCi9YGhGPNOvLrS19SASCk31o3hHsQGxyUMusJaMFJMVRtjl7Das7AuEifubG7/s16000/screenshot_1767925641.png";

const IMG_PROFILE =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh6gkIbd6tCTBY2XHMbFxBrTnp8kJG63T0AkwGDkVh3k0311WeJ2zcelG_eo3NsVvdGPN1zUBv3K3AmI4C_qVJ6fvlAE4gZh-bsVgyaud4Lb4Mrd_r7WMrGmCZu5ArlU2j80BC2imMTf-BthVruvsjPqKyrjJk7R5CRgigqeAaTcrj5Bx_8Rn7o-VkCjVMZ/s16000/screenshot_1768016295.png";

const IMG_PHONE =
  "https://4216176300-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FoBm1hkWlFGKdeqecZYLv%2Fuploads%2FmJo45UvJB0k4dxiEbDGb%2Fimage.png?alt=media&token=ec8a8f8a-0ecf-46a6-b53c-da2c8f0c30df";

function StepBadge({ n }: { n: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow shadow-purple-500/40">
      {n}
    </span>
  );
}

function GuideImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-slate-800 shadow-lg shadow-black/40">
      <img src={src} alt={alt} className="w-full object-cover" loading="lazy" />
    </div>
  );
}

function NoteBadge({
  type,
  children,
}: {
  type: "warning" | "info" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    warning: {
      wrapper: "border-amber-500/40 bg-amber-500/10 text-amber-100",
      icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />,
    },
    info: {
      wrapper: "border-sky-500/40 bg-sky-500/10 text-sky-100",
      icon: <Info className="h-4 w-4 shrink-0 text-sky-400" />,
    },
    success: {
      wrapper: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
      icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />,
    },
  }[type];

  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles.wrapper}`}>
      {styles.icon}
      <div>{children}</div>
    </div>
  );
}

export default function AdobeGuidePage() {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
    queryFn: fetchProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/20 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={() => navigate(ROUTES.home)}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={products.map((p) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories.map((c) => ({
            id: String(c.id),
            name: c.name,
            slug: c.name.toLowerCase().replace(/\s+/g, "-"),
          }))}
          onProductClick={(slug) => navigate(`/${encodeURIComponent(slug)}`)}
          onCategoryClick={(slug) => navigate(ROUTES.category(slug))}
          user={user}
          onLogout={logout}
        />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Back */}
        <button
          onClick={() => navigate(ROUTES.otp)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại Fix lỗi Adobe
        </button>

        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-8 shadow-2xl shadow-purple-900/20">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-purple-600/30 blur-3xl" />
          <div className="relative">
            <span className="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-300">
              Hướng dẫn chính
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-50 sm:text-3xl">
              Đăng nhập lại Team mới
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Hướng dẫn từng bước đăng xuất tài khoản cũ và đăng nhập team mới trên Creative Cloud.
            </p>
            {/* Video */}
            <a
              href="https://www.youtube.com/watch?v=0gLuRqUFDvU"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600/90 px-4 py-2.5 text-sm font-semibold text-white shadow shadow-red-600/40 hover:bg-red-600 transition-colors"
            >
              <Youtube className="h-4 w-4" />
              Xem video hướng dẫn
            </a>
          </div>
        </div>

        <div className="space-y-8">
          {/* BƯỚC 1 */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n="1" />
              <h2 className="text-base font-bold text-slate-100">Lấy Profile Active</h2>
            </div>
            <p className="mb-3 text-sm text-slate-300">
              Truy cập{" "}
              <a
                href="https://mavrykpremium.store/system"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple-400 underline underline-offset-2 hover:text-purple-300"
              >
                mavrykpremium.store/system
              </a>
              , nhập email Adobe được cấp vào ô Email Address rồi bấm{" "}
              <span className="font-semibold text-slate-100">Get Profile Active</span>.
            </p>
          </section>

          {/* BƯỚC 2 */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n="2" />
              <h2 className="text-base font-bold text-slate-100">Mở ứng dụng Creative Cloud</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <img src={CC_ICON} alt="Creative Cloud" className="h-5 w-5" />
                <span>
                  <span className="font-semibold text-slate-100">Windows:</span> Vào Start Menu, gõ{" "}
                  <span className="font-mono text-xs text-purple-300">Creative Cloud</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img src={CC_ICON} alt="Creative Cloud" className="h-5 w-5" />
                <span>
                  <span className="font-semibold text-slate-100">MacOS:</span> Vào Launchpad, tìm{" "}
                  <span className="font-mono text-xs text-purple-300">Creative Cloud</span>
                </span>
              </div>
            </div>

            <GuideImage src={IMG_LOGIN_SCREEN} alt="Màn hình Creative Cloud" />

            {/* Bước 2.1 */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="2.1" />
                <h3 className="text-sm font-bold text-slate-200">Đăng xuất tài khoản cũ</h3>
              </div>
              <p className="text-sm text-slate-300">
                Bấm vào <span className="font-semibold text-slate-100">Avatar</span> góc trên bên phải
                → chọn <span className="font-semibold text-red-400">Sign Out</span>.
              </p>
              <GuideImage src={IMG_SIGN_OUT} alt="Sign Out Creative Cloud" />
            </div>

            {/* Bước 2.2 */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <StepBadge n="2.2" />
                <h3 className="text-sm font-bold text-slate-200">Đăng nhập tài khoản mới</h3>
              </div>
              <p className="text-sm text-slate-300">
                Điền email Adobe được cấp vào ô đăng nhập.
              </p>
              <GuideImage src={IMG_SIGN_IN} alt="Đăng nhập Creative Cloud" />
              <p className="text-sm text-slate-300">Nhập mật khẩu tài khoản.</p>
              <GuideImage src={IMG_PASSWORD} alt="Nhập mật khẩu" />

              <NoteBadge type="warning">
                <strong>Nếu hỏi mã đăng nhập</strong> → inbox cho người bán để lấy mã (một số máy sẽ
                yêu cầu, một số thì không).
              </NoteBadge>
            </div>
          </section>

          {/* BƯỚC 3 */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n="3" />
              <h2 className="text-base font-bold text-slate-100">Chọn Profile</h2>
            </div>
            <p className="mb-3 text-sm text-slate-300">
              Khi hiện danh sách profile, chọn{" "}
              <span className="font-semibold text-slate-100">Company or School</span> theo kết quả lấy
              được từ Bước 1.
            </p>
            <GuideImage src={IMG_PROFILE} alt="Chọn profile" />
            <NoteBadge type="warning">
              Nếu chưa thấy profile sau khi đăng nhập → chờ{" "}
              <span className="font-semibold">30 phút</span> rồi thử lại.
            </NoteBadge>
          </section>

          {/* BƯỚC 4 */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n="4" />
              <h2 className="text-base font-bold text-slate-100">Bỏ qua số điện thoại</h2>
            </div>
            <p className="mb-3 text-sm text-slate-300">
              Nếu xuất hiện thông báo <span className="italic text-slate-400">"Add mobile phone number"</span> → bấm{" "}
              <span className="font-semibold text-slate-100">Not Now</span> để bỏ qua.
            </p>
            <GuideImage src={IMG_PHONE} alt="Bỏ qua số điện thoại" />
            <NoteBadge type="success">
              Đợi tài khoản load xong là sử dụng bình thường.
            </NoteBadge>
          </section>

          {/* CTA quay lại */}
          <div className="text-center">
            <button
              onClick={() => navigate(ROUTES.otp)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-purple-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại kiểm tra Profile
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
