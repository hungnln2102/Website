import { useState, useEffect } from "react";

/**
 * Khớp lưới catalog: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
 * (breakpoint Tailwind mặc định: sm 640, lg 1024, xl 1280).
 */
export function useCatalogGridColumnCount(): number {
  const [cols, setCols] = useState(2);

  useEffect(() => {
    const read = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 0;
      if (w >= 1280) setCols(5);
      else if (w >= 1024) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };

    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  return cols;
}
