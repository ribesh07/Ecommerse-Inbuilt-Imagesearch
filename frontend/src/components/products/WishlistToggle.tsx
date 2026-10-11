"use client";

import { useWishlist } from "@/context/WishlistContext";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Product-level wishlist toggle. */
export function WishlistToggle({
  productId,
  className,
  size = "md",
}: {
  productId: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const { has, toggle, ready } = useWishlist();
  const active = ready && has(productId);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={cn(
        "focus-ring flex items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-500 backdrop-blur transition-colors hover:text-rose-600",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        active && "text-rose-600",
        className,
      )}
    >
      <HeartIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} filled={active} />
    </button>
  );
}
