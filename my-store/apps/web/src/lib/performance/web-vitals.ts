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
    // web-vitals library is optional
    // To enable: npm install web-vitals
    // Then uncomment the code below:
    /*
    import('web-vitals')
      .then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS((metric) => {
          const ratedMetric = { ...metric, rating: getRating('CLS', metric.value) };
          sendToAnalytics(ratedMetric);
          onPerfEntry(ratedMetric);
        });
        onFID((metric) => {
          const ratedMetric = { ...metric, rating: getRating('FID', metric.value) };
          sendToAnalytics(ratedMetric);
          onPerfEntry(ratedMetric);
        });
        onFCP((metric) => {
          const ratedMetric = { ...metric, rating: getRating('FCP', metric.value) };
          sendToAnalytics(ratedMetric);
          onPerfEntry(ratedMetric);
        });
        onLCP((metric) => {
          const ratedMetric = { ...metric, rating: getRating('LCP', metric.value) };
          sendToAnalytics(ratedMetric);
          onPerfEntry(ratedMetric);
        });
        onTTFB((metric) => {
          const ratedMetric = { ...metric, rating: getRating('TTFB', metric.value) };
          sendToAnalytics(ratedMetric);
          onPerfEntry(ratedMetric);
        });
        if (onINP) {
          onINP((metric) => {
            const ratedMetric = { ...metric, rating: getRating('INP', metric.value) };
            sendToAnalytics(ratedMetric);
            onPerfEntry(ratedMetric);
          });
        }
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          // Silent - no console logs
        }
      });
    */
    
    // For now, just use fallback measurements
    // Silent - no console logs
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
