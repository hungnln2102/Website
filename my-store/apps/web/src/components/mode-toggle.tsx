"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import * as React from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:shadow-md hover:scale-105 active:scale-95 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <div className="relative h-5 w-5">
        <Sun 
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            theme === "dark" 
              ? "rotate-0 scale-100 opacity-100" 
              : "rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon 
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            theme === "dark" 
              ? "-rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </div>
    </button>
  );
}
