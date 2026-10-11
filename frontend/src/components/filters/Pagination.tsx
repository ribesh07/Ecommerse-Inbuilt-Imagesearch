"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Accessible pagination control driven entirely by the `page` query param. */
export function Pagination({
  page,
  total,
  limit,
}: {
  page: number;
  total: number;
  limit: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.push(qs ? `/product?${qs}` : "/product", { scroll: true });
  };

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="focus-ring flex h-9 items-center gap-1 rounded-lg border border-ink-200 px-3 text-sm text-ink-600 disabled:opacity-40 hover:bg-ink-50"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "focus-ring flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm",
              item === page
                ? "bg-brand-600 font-semibold text-white"
                : "border border-ink-200 text-ink-600 hover:bg-ink-50",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="focus-ring flex h-9 items-center gap-1 rounded-lg border border-ink-200 px-3 text-sm text-ink-600 disabled:opacity-40 hover:bg-ink-50"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}

/** Produces a compact page list with ellipses around the current page. */
function pageWindow(current: number, total: number): Array<number | "…"> {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) result.push("…");
    result.push(p);
    previous = p;
  }
  return result;
}
