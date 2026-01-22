import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/20 bg-destructive/5 p-6',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-destructive hover:underline focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
