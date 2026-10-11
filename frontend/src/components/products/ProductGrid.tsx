import { ProductCard } from "./ProductCard";
import type { ProductListItem } from "@/lib/api/types";
import { cn } from "@/lib/cn";

/** Responsive product grid. Server-safe: just maps items to cards. */
export function ProductGrid({
  products,
  className,
  priorityCount = 0,
}: {
  products: ProductListItem[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
