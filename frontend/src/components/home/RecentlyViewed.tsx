"use client";

import { ProductRail } from "@/components/products/ProductRail";
import { SectionHeading } from "./SectionHeading";
import { useCountry } from "@/context/CountryContext";
import { recentlyViewedStore } from "@/lib/recently-viewed";
import { usePersistentStore } from "@/lib/persistent-store";
import type { ProductListItem } from "@/lib/api/types";

/**
 * Client-only "recently viewed" rail, read from localStorage (via
 * useSyncExternalStore). No backend endpoint is involved; the section hides
 * itself when the list is empty.
 */
export function RecentlyViewed() {
  const { countryCode } = useCountry();
  const items = usePersistentStore(recentlyViewedStore);

  if (items.length === 0) return null;

  // Recently-viewed snapshots carry a single price/currency captured at add-time.
  const asProducts: ProductListItem[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    sku: "",
    brand: null,
    category: null,
    price: item.price ?? { amount: "0", currency: countryCode },
    thumbnail: item.thumbnail,
    rating: "0",
    stock: 1,
    compare_price: null,
    short_description: null,
  }));

  return (
    <section aria-labelledby="recently-viewed-heading">
      <SectionHeading title="Recently viewed" subtitle="Pick up where you left off" />
      <ProductRail products={asProducts} />
    </section>
  );
}
