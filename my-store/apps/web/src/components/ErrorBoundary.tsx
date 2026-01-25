import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { errorTracker } from '@/lib/error-tracking/error-tracker';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    errorTracker.captureException(error, {
      tags: {
        component: 'ErrorBoundary',
        errorBoundary: 'true',
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border border-destructive/20 bg-card p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Đã xảy ra lỗi
            </h1>
            
            <p className="mb-6 text-muted-foreground">
              Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.
            </p>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-6 rounded-md bg-muted p-4 text-left">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Error Details:
                </p>
                <pre className="overflow-x-auto text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCcw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
