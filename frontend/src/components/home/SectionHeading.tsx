import Link from "next/link";
import { ChevronRightIcon, AlertIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Section header with an optional "view all" link. */
export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "View all",
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="focus-ring flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          {linkLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

/** Server-friendly inline notice used when a section has no data. */
export function InlineNotice({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-6 text-sm",
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-dashed border-ink-200 bg-ink-50 text-ink-500",
      )}
    >
      {tone === "error" ? <AlertIcon className="h-4 w-4 shrink-0" /> : null}
      {message}
    </div>
  );
}
