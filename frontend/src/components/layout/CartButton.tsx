"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { CartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Cart link with a live item-count badge. */
export function CartButton({ className }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className={cn(
        "focus-ring relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100",
        className,
      )}
    >
      <CartIcon className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
