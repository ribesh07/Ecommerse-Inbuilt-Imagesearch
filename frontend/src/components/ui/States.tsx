import { AlertIcon, RefreshIcon } from "./icons";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

/** Error panel with an optional retry action, used by all API-driven blocks. */
export function ErrorState({
  title = "Something went wrong",
  message = "Unable to load this content. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-ink-200 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertIcon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-500">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshIcon className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Neutral empty state. */
export function EmptyState({
  icon,
  title = "Nothing here yet",
  message,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-ink-200 bg-ink-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-400">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="font-semibold text-ink-800">{title}</p>
        {message ? <p className="mt-1 text-sm text-ink-500">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}
