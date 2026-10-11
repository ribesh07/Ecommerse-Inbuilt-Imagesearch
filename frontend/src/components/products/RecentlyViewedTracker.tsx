"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import type { ProductListItem } from "@/lib/api/types";

/**
 * Records a product view into the client-side "recently viewed" store. Rendered
 * on the product detail page; it has no visual output.
 */
export function RecentlyViewedTracker({ product }: { product: ProductListItem }) {
  useEffect(() => {
    addRecentlyViewed(product);
  }, [product]);
  return null;
}
