import { useEffect, useState } from "react";
import { SCROLL_THRESHOLDS } from "@/lib/constants";

/**
 * Custom hook to track scroll position and determine if header should be collapsed
 * Uses requestAnimationFrame for performance optimization
 */
export const useScroll = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled((prev) => {
            if (!prev && scrollY > SCROLL_THRESHOLDS.headerCollapse) return true;
            if (prev && scrollY < SCROLL_THRESHOLDS.headerExpand) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isScrolled;
};
