"use client";

import { useState } from "react";
import { ProductToolbar, type ViewMode } from "./ProductToolbar";
import { ProductResultsGrid, ProductResultsList } from "@/components/products/ProductResults";
import { Pagination } from "./Pagination";
import type { ParsedProductParams } from "@/lib/search-params";
import type { ProductFilters, ProductListItem } from "@/lib/api/types";

/**
 * Client shell that owns the grid/list view toggle and composes the toolbar,
 * results and pagination. Product data itself is fetched on the server and
 * passed down, so switching views never refetches.
 */
export function ResultsView({
  products,
  total,
  limit,
  parsed,
  facets,
}: {
  products: ProductListItem[];
  total: number;
  limit: number;
  parsed: ParsedProductParams;
  facets: ProductFilters | null;
}) {
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <div className="space-y-4">
      <ProductToolbar
        total={total}
        parsed={parsed}
        facets={facets}
        view={view}
        onViewChange={setView}
      />

      {view === "grid" ? (
        <ProductResultsGrid products={products} />
      ) : (
        <ProductResultsList products={products} />
      )}

      <div className="pt-2">
        <Pagination page={parsed.page} total={total} limit={limit} />
      </div>
    </div>
  );
}
