/**
 * Error tracking utility
 * Supports Sentry or fallback console logging
 */

interface ErrorContext {
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'error' | 'warning' | 'info';
}

class ErrorTracker {
  private initialized = false;
  private sentry: any = null;
  private isBlocked = false;
  private blockCheckAttempted = false;

  /**
   * Initialize error tracking
   */
  async init() {
    if (this.initialized) return;

    // Try to load Sentry if DSN is provided
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (sentryDsn) {
      try {
        // Dynamic import to avoid bundling Sentry in dev if not needed
        const Sentry = await import('@sentry/react');
        
        // Build integrations array
        const integrations: any[] = [];

        // Only add performance monitoring and replay in production
        // These can be blocked by ad blockers, so we disable them in dev
        if (import.meta.env.PROD) {
          integrations.push(
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            })
          );
        }

        Sentry.init({
          dsn: sentryDsn,
          environment: import.meta.env.MODE || 'development',
          // Setting this option to true will send default PII data to Sentry
          // For example, automatic IP address collection on events
          sendDefaultPii: true,
          integrations,
          // Performance Monitoring - Disable in dev to reduce network errors
          tracesSampleRate: import.meta.env.PROD ? 0.1 : 0, // 10% in prod, 0% in dev
          // Session Replay (only in production)
          replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0, // Disabled in dev
          replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0, // Disabled in dev
          // Release tracking
          release: import.meta.env.VITE_APP_VERSION || undefined,
          // Disable client reports in dev to avoid "Failed to fetch" errors
          sendClientReports: import.meta.env.PROD,
          // Allow sending events from localhost for testing
          beforeSend(event, hint) {
            // Silent - no logging to reduce console noise
            return event;
          },
          // Handle transport errors gracefully - suppress in dev
          transportOptions: {
            // Retry configuration
            maxRetries: import.meta.env.PROD ? 3 : 0, // No retries in dev
            retryDelay: 1000,
          },
          // Suppress debug logs for transport errors in dev
          debug: false, // Disable debug to reduce console noise
        });
        
        this.sentry = Sentry;
        this.initialized = true;
        
        // Silent initialization - no logs
        // Test connection is disabled to reduce console noise
        
        return;
      } catch (error) {
        console.warn('[Error Tracker] Failed to initialize Sentry:', error);
        // Fall through to console fallback
      }
    }
    
    // Fallback: Use console logging
    this.initialized = true;
    if (!sentryDsn) {
      console.log('[Error Tracker] Using console fallback (no VITE_SENTRY_DSN set)');
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: ErrorContext) {
    if (this.sentry && this.sentry.captureException) {
      this.sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level || 'error',
        user: context?.userId ? { id: context?.userId } : undefined,
      });
    } else {
      // Fallback logging
      console.error('[Error]', {
        message: error.message,
        stack: error.stack,
        ...context,
      });
    }
  }

  /**
   * Capture message
   */
  captureMessage(message: string, context?: ErrorContext) {
    if (this.sentry && this.sentry.captureMessage) {
      this.sentry.captureMessage(message, {
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level || 'info',
      });
    } else {
      // Fallback logging
      const level = context?.level || 'info';
      if (level === 'error') {
        console.error('[Error Message]', message, context);
      } else if (level === 'warning') {
        console.warn('[Warning]', message, context);
      } else {
        console.log('[Info]', message, context);
      }
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, username?: string) {
    if (this.sentry && this.sentry.setUser) {
      this.sentry.setUser({
        id: userId,
        email,
        username,
      });
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category?: string, level?: 'error' | 'warning' | 'info') {
    if (this.sentry && this.sentry.addBreadcrumb) {
      this.sentry.addBreadcrumb({
        message,
        category: category || 'default',
        level: level || 'info',
      });
    }
  }

  /**
   * Test if Sentry connection is working and detect blocking
   * Disabled to reduce console noise
   */
  private async testConnection() {
    // Disabled - no test connection to reduce console logs
    return;
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Initialize on module load
if (typeof window !== 'undefined') {
  errorTracker.init();
}
