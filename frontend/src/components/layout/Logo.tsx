import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark logo. Pure link, safe in server components. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Sukilo — home"
      className={cn("focus-ring flex items-center gap-2 rounded-lg", className)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        S
      </span>
      <span className="text-lg font-bold tracking-tight text-ink-900">
        Sukilo<span className="text-brand-600">.</span>
      </span>
    </Link>
  );
}
