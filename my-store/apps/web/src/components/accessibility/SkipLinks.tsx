/**
 * Skip Links component for accessibility
 * Allows keyboard users to skip to main content
 */

import { useEffect } from "react";

export default function SkipLinks() {
  useEffect(() => {
    // Handle skip link navigation
    const handleSkipLink = (e: KeyboardEvent) => {
      // Alt + S: Skip to main content
      if (e.altKey && e.key === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const mainContent = document.querySelector("main") || document.querySelector("#main-content");
        if (mainContent) {
          (mainContent as HTMLElement).focus();
          mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    window.addEventListener("keydown", handleSkipLink);
    return () => window.removeEventListener("keydown", handleSkipLink);
  }, []);

  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.querySelector("main") || document.querySelector("#main-content");
          if (mainContent) {
            (mainContent as HTMLElement).focus();
            mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        Bỏ qua đến nội dung chính
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={(e) => {
          e.preventDefault();
          const nav = document.querySelector("nav") || document.querySelector("#navigation");
          if (nav) {
            const firstFocusable = nav.querySelector<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
              firstFocusable.focus();
            }
          }
        }}
      >
        Bỏ qua đến menu điều hướng
      </a>
    </div>
  );
}
