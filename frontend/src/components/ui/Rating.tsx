import { StarIcon } from "./icons";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

/** Star rating display. Renders nothing when there is no rating. */
export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: string | number | null | undefined;
  count?: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
  if (numeric === null || numeric === undefined || !Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  const rounded = Math.round(numeric * 2) / 2;
  const starClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Rated ${numeric.toFixed(1)} out of 5`}>
      <span className="flex text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} className={starClass} filled={star <= rounded} />
        ))}
      </span>
      <span className="text-xs font-medium text-ink-600">{numeric.toFixed(1)}</span>
      {typeof count === "number" ? (
        <span className="text-xs text-ink-400">({formatNumber(count)})</span>
      ) : null}
    </div>
  );
}
