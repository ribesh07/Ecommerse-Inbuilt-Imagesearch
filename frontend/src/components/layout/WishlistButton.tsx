"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Wishlist link with a live count badge. */
export function WishlistButton({ className }: { className?: string }) {
  const { count } = useWishlist();
  return (
    <Link
      href="/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} items` : "Wishlist"}
      className={cn(
        "focus-ring relative hidden h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 sm:flex",
        className,
      )}
    >
      <HeartIcon className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
