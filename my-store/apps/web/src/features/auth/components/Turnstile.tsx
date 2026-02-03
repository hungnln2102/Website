"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Cloudflare Turnstile - More secure CAPTCHA alternative
 * Harder to bypass than Google reCAPTCHA
 * 
 * Benefits:
 * - Privacy-focused (no tracking)
 * - Often invisible/non-interactive
 * - Free unlimited usage
 * - Better bot detection with Cloudflare's network data
 */

// Declare global turnstile
declare global {
  interface Window {
    turnstile: {
      ready: (callback: () => void) => void;
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (error: Error) => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          language?: string;
          action?: string;
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: Error) => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  action?: string;
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = "auto",
  size = "normal",
  action,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isRenderedRef = useRef(false);

  const renderTurnstile = useCallback(() => {
    if (!containerRef.current || isRenderedRef.current || !window.turnstile) return;

    try {
      // Clear any existing widget
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": () => {
          onExpire?.();
        },
        "error-callback": (error) => {
          onError?.(error);
        },
        theme,
        size,
        action,
        appearance: "always",
      });
      isRenderedRef.current = true;
    } catch (err) {
      console.error("Turnstile render error:", err);
    }
  }, [siteKey, onVerify, onExpire, onError, theme, size, action]);

  useEffect(() => {
    // Check if script already loaded
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      // Script exists, check if turnstile is ready
      if (window.turnstile) {
        window.turnstile.ready(renderTurnstile);
      } else {
        // Wait for script to load
        window.onTurnstileLoad = renderTurnstile;
      }
      return;
    }

    // Load Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = renderTurnstile;

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
      isRenderedRef.current = false;
      widgetIdRef.current = null;
    };
  }, [renderTurnstile]);

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} />
    </div>
  );
}

/**
 * Reset Turnstile widget (call after form submission)
 */
export function resetTurnstile(widgetId?: string) {
  if (window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

/**
 * Get current Turnstile response token
 */
export function getTurnstileResponse(widgetId?: string): string | undefined {
  if (window.turnstile) {
    return window.turnstile.getResponse(widgetId);
  }
  return undefined;
}
