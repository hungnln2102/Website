"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/features/auth/hooks";
import { getCartCount, getAuthToken } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

/** Icon giỏ hàng trên thanh header (không text), badge số lượng khi đã đăng nhập. */
export function CartHeaderButton() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Array<{ quantity?: number }>>;
      const items = customEvent.detail ?? [];
      const count = Array.isArray(items) ? items.reduce((s, i) => s + (i.quantity ?? 1), 0) : 0;
      setCartCount(count);
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    if (user) {
      const token = getAuthToken();
      getCartCount(token).then((res) => {
        if (res.success && res.data != null) setCartCount(res.data.totalItems ?? 0);
      });
    } else {
      setCartCount(0);
    }

    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [user]);

  const goToLogin = () => {
    window.history.pushState({}, "", ROUTES.login);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      goToLogin();
    }
  };

  return (
    <a
      href={user ? ROUTES.cart : "#"}
      onClick={handleClick}
      className="group relative flex shrink-0 cursor-pointer items-center justify-center rounded-xl px-2 py-2 transition-all duration-300 hover:bg-blue-50 active:scale-95 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] dark:hover:bg-blue-900/20"
      aria-label="Giỏ hàng"
    >
      <ShoppingCart className="h-5 w-5 shrink-0 text-gray-600 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-105 dark:text-slate-400 dark:group-hover:text-blue-400" />
      {user && cartCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm sm:h-[18px] sm:min-w-[18px] sm:text-[11px]">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </a>
  );
}
