import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { reportWebVitals, measurePerformance } from '@/lib/performance/web-vitals';
import { errorTracker } from '@/lib/error-tracking/error-tracker';
import App from './App';
import './index.css';

// Retry function with exponential backoff
const retryWithBackoff = (failureCount: number, error: unknown) => {
  // Don't retry on 4xx errors (client errors)
  if (error instanceof Error) {
    if (error.message.includes('404') || error.message.includes('403') || error.message.includes('401')) {
      return false;
    }
  }
  // Retry up to 3 times for network/server errors
  return failureCount < 3;
};

// Configure React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: retryWithBackoff,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Initialize error tracking
errorTracker.init();

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
reportWebVitals(() => {
  // Metrics are automatically sent via web-vitals.ts
  // No console logging to reduce noise
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        storageKey="vite-ui-theme"
      >
        <App />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
