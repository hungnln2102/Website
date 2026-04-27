"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Cloudflare Turnstile — cần site key từ Cloudflare Dashboard (chế độ **Managed**)
 * mới thấy ô tích; chế độ Invisible/Non-interactive sẽ không hiện checkbox.
 * @see https://developers.cloudflare.com/turnstile/get-started/
 */

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
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          language?: string;
          action?: string;
          appearance?: "always" | "execute" | "interaction-only";
          retry?: "auto" | "never";
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
  onError?: (error: unknown) => void;
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
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  const [renderError, setRenderError] = useState<string | null>(null);

  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  const doRender = useCallback(() => {
    if (!containerRef.current || isRenderedRef.current || !window.turnstile) return;

    try {
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* no-op */
        }
        widgetIdRef.current = null;
      }

      setRenderError(null);

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current?.(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => {
          setRenderError(
            "Không tải được xác minh. Tắt chặn Cloudflare, thêm domain tại Cloudflare Turnstile, rồi tải lại trang."
          );
          onErrorRef.current?.(new Error("turnstile_error"));
        },
        theme,
        size,
        action,
        appearance: "always",
        language: "vi",
        retry: "auto",
      });
      isRenderedRef.current = true;
    } catch (err) {
      console.error("Turnstile render error:", err);
      setRenderError("Lỗi hiển thị Turnstile. Kiểm tra site key và mạng.");
    }
  }, [siteKey, theme, size, action]);

  const runWhenReady = useCallback(() => {
    if (!window.turnstile) return;
    window.turnstile.ready(() => {
      requestAnimationFrame(() => {
        doRender();
      });
    });
  }, [doRender]);

  useEffect(() => {
    isRenderedRef.current = false;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* no-op */
      }
      widgetIdRef.current = null;
    }
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;

    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      if (window.turnstile) {
        runWhenReady();
      } else {
        const prev = window.onTurnstileLoad;
        window.onTurnstileLoad = () => {
          prev?.();
          runWhenReady();
        };
      }
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
      script.async = true;
      script.defer = true;
      const prev = window.onTurnstileLoad;
      window.onTurnstileLoad = () => {
        prev?.();
        runWhenReady();
      };
      document.head.appendChild(script);
    }

    return () => {
      isRenderedRef.current = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* no-op */
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, runWhenReady]);

  return (
    <div className="my-2 w-full">
      <div
        ref={containerRef}
        className="min-h-[70px] w-full min-w-0 flex items-center justify-center"
        data-testid="turnstile-container"
      />
      {renderError && (
        <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400" role="alert">
          {renderError}
        </p>
      )}
    </div>
  );
}

export function resetTurnstile(widgetId?: string) {
  if (window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

export function getTurnstileResponse(widgetId?: string): string | undefined {
  if (window.turnstile) {
    return window.turnstile.getResponse(widgetId);
  }
  return undefined;
}
