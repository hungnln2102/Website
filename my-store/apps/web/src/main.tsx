import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { reportWebVitals, measurePerformance } from '@/lib/performance/web-vitals';
import { errorTracker } from '@/lib/error-tracking/error-tracker';
import App from './App';
import { AuthProvider } from '@/features/auth/hooks';
import {
  idempotentGetRetryDelay,
  shouldRetryIdempotentQuery,
} from '@/lib/api/query-retry';
import './index.css';

const PERF_DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("perf");

type PerfWindow = Window & {
  __WEB_VITALS__?: Record<string, number>;
};

// Configure React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: shouldRetryIdempotentQuery,
      retryDelay: idempotentGetRetryDelay,
    },
  },
});

function scheduleErrorTrackerInit() {
  if (typeof window === "undefined") return;
  const hasSentryDsn = Boolean(import.meta.env.VITE_SENTRY_DSN);
  if (!hasSentryDsn) return;

  const init = () => {
    void errorTracker.init();
  };

  const idleApi = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (idleApi.requestIdleCallback) {
    idleApi.requestIdleCallback(init, { timeout: 4000 });
  } else {
    window.setTimeout(init, 2000);
  }
}

scheduleErrorTrackerInit();

// Register Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
        errorTracker.captureException(error, {
          tags: { component: 'ServiceWorker' },
        });
      });
  });
}

// Report Web Vitals (silent - no console logs)
reportWebVitals((metric) => {
  if (!PERF_DEBUG || typeof window === "undefined") return;
  const value = Math.round(Number(metric.value) * 1000) / 1000;
  (window as PerfWindow).__WEB_VITALS__ = {
    ...((window as PerfWindow).__WEB_VITALS__ ?? {}),
    [metric.name]: value,
  };
  console.log(`[WebVitals] ${metric.name}=${value}`);
});

// Measure performance on load
window.addEventListener('load', () => {
  setTimeout(measurePerformance, 1000);
});

// Global error handler - filter out third-party script errors
window.addEventListener('error', (event) => {
  // Ignore errors from third-party scripts (DMCA, cleanweb, etc.)
  const thirdPartyScripts = [
    'dmca.com',
    'DMCABadgeHelper',
    'cleanweb',
    'Script error', // Generic CORS error
  ];
  
  const isThirdPartyError = thirdPartyScripts.some(script => 
    event.filename?.includes(script) || 
    event.message?.includes(script)
  );
  
  if (!isThirdPartyError && event.error) {
    errorTracker.captureException(event.error, {
      tags: { type: 'unhandled-error' },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  }
});

// Global unhandled promise rejection handler - filter third-party errors
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = String(event.reason);
  const thirdPartyScripts = ['cleanweb', 'dmca', 'DMCABadgeHelper'];
  
  const isThirdPartyError = thirdPartyScripts.some(script => 
    errorMessage.toLowerCase().includes(script.toLowerCase())
  );
  
  if (!isThirdPartyError) {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(errorMessage);
    
    errorTracker.captureException(error, {
      tags: { type: 'unhandled-rejection' },
    });
  }
});

const removeSeoFallbackContent = () => {
  document.getElementById('seo-fallback-content')?.remove();
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        storageKey="vite-ui-theme"
      >
        <AuthProvider>
          <App />
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

requestAnimationFrame(removeSeoFallbackContent);
