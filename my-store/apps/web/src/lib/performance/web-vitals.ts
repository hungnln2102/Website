/**
 * Core Web Vitals tracking
 * Measures LCP, FID, CLS, FCP, TTFB
 */

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

type ReportCallback = (metric: Metric) => void;

/**
 * Send metrics to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  // In production, send to your analytics service (silently)
  if (import.meta.env.PROD) {
    // Example: Send to your backend
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(() => {
    //   // Silently fail in production
    // });
    
    // Don't log to console in production
    return;
  } else {
    // Development: silent (no console logs to reduce noise)
    // Metrics are still measured but not logged
  }
}

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals
 * Uses fallback measurements by default
 * To enable web-vitals library: npm install web-vitals
 */
export function reportWebVitals(onPerfEntry?: ReportCallback) {
  // Always use fallback measurements (works without external dependencies)
  measurePerformance();
  
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    let hasNativeINP = false;
    startInteractionLatencyFallback(() => hasNativeINP, onPerfEntry);

    import('web-vitals')
      .then((webVitals: any) => {
        const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = webVitals;

        const options = { reportAllChanges: true };

        if (typeof onCLS === "function") {
          onCLS((metric: any) => {
            const ratedMetric = { ...metric, rating: getRating('CLS', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          }, options);
        }
        if (typeof onFID === "function") {
          onFID((metric: any) => {
            const ratedMetric = { ...metric, rating: getRating('FID', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          });
        }
        if (typeof onFCP === "function") {
          onFCP((metric: any) => {
            const ratedMetric = { ...metric, rating: getRating('FCP', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          }, options);
        }
        if (typeof onLCP === "function") {
          onLCP((metric: any) => {
            const ratedMetric = { ...metric, rating: getRating('LCP', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          }, options);
        }
        if (typeof onTTFB === "function") {
          onTTFB((metric: any) => {
            const ratedMetric = { ...metric, rating: getRating('TTFB', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          }, options);
        }
        if (typeof onINP === "function") {
          onINP((metric: any) => {
            hasNativeINP = true;
            const ratedMetric = { ...metric, rating: getRating('INP', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          }, options);
        }
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          // Silent - no console logs
        }
      });
  }
}

function startInteractionLatencyFallback(
  hasNativeINP: () => boolean,
  onPerfEntry: ReportCallback
) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  let maxInteractionDuration = 0;
  let maxEntry: PerformanceEntry | undefined;

  const emitFallbackINP = () => {
    if (hasNativeINP() || maxInteractionDuration <= 0) return;
    const metric: Metric = {
      name: 'INP',
      value: maxInteractionDuration,
      rating: getRating('INP', maxInteractionDuration),
      delta: maxInteractionDuration,
      id: `inp-fallback-${Date.now()}`,
      entries: maxEntry ? [maxEntry] : [],
    };
    sendToAnalytics(metric);
    onPerfEntry(metric);
  };

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as Array<PerformanceEntry & { interactionId?: number; duration?: number }>;
      for (const entry of entries) {
        const interactionId = entry.interactionId ?? 0;
        const duration = Number(entry.duration ?? 0);
        const fromKnownInput =
          entry.name === 'click' ||
          entry.name === 'keydown' ||
          entry.name === 'pointerdown' ||
          entry.name === 'pointerup';
        if ((!fromKnownInput && interactionId <= 0) || duration <= maxInteractionDuration) continue;
        maxInteractionDuration = duration;
        maxEntry = entry;
        emitFallbackINP();
      }
    });
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') emitFallbackINP();
    });
  } catch {
    // Browser does not support Event Timing API options
  }
}

/**
 * Manual performance measurement fallback
 */
export function measurePerformance() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Measure FCP (First Contentful Paint)
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    sendToAnalytics({
      name: 'FCP',
      value: fcpEntry.startTime,
      rating: getRating('FCP', fcpEntry.startTime),
      delta: fcpEntry.startTime,
      id: 'fcp-' + Date.now(),
      entries: [fcpEntry],
    });
  }

  // Measure TTFB (Time to First Byte)
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    sendToAnalytics({
      name: 'TTFB',
      value: ttfb,
      rating: getRating('TTFB', ttfb),
      delta: ttfb,
      id: 'ttfb-' + Date.now(),
      entries: [navigationEntry],
    });
  }
}
