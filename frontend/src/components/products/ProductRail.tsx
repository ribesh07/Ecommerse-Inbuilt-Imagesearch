"use client";

import { useRef } from "react";
import { ProductCard } from "./ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { ProductListItem } from "@/lib/api/types";

/**
 * Horizontally scrollable product rail for home sections. Uses native scroll
 * with snap points; the arrow buttons simply nudge the scroll position.
 */
export function ProductRail({ products }: { products: ProductListItem[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.min(node.clientWidth * 0.8, 640), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:gap-4"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%] xl:w-[19%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
