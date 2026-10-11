"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";

/** Route-level error boundary for the whole app. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for diagnostics without leaking it to the UI.
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-ink-500">
        We couldn&apos;t load this page. This is usually temporary — please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
