"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GridIcon, ListIcon, SlidersIcon, CloseIcon } from "@/components/ui/icons";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { ProductFiltersPanel } from "@/components/filters/ProductFiltersPanel";
import { PRODUCT_SORTS, buildProductHref, type ParsedProductParams } from "@/lib/search-params";
import { useLocale } from "@/context/LocaleContext";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useState } from "react";
import type { ProductFilters } from "@/lib/api/types";

export type ViewMode = "grid" | "list";

/**
 * Listing toolbar: result count, sort dropdown, view toggle and the mobile
 * filter drawer. Sort/view changes rewrite the URL (sort) or local state (view).
 */
export function ProductToolbar({
  total,
  parsed,
  facets,
  view,
  onViewChange,
}: {
  total: number;
  parsed: ParsedProductParams;
  facets: ProductFilters | null;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLocale();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeSort = PRODUCT_SORTS.find((s) => s.value === parsed.sort) ?? PRODUCT_SORTS[0];

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    router.push(`/product?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2.5 sm:px-4">
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{formatNumber(total, language)}</span>{" "}
          {t("results")}
        </p>

        <div className="flex items-center gap-2">
          {/* Mobile filter trigger */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersIcon className="h-4 w-4" />
            {t("filters")}
          </Button>

          {/* Sort */}
          <Dropdown
            ariaLabel="Sort products"
            label={
              <span className="flex items-center gap-1">
                <span className="text-ink-400">{t("sort")}:</span>
                <span className="font-medium text-ink-800">{activeSort.label}</span>
              </span>
            }
            align="right"
          >
            {(close) => (
              <div>
                {PRODUCT_SORTS.map((option) => (
                  <DropdownItem
                    key={option.value}
                    selected={option.value === parsed.sort}
                    onClick={() => {
                      setSort(option.value);
                      close();
                    }}
                  >
                    {option.label}
                  </DropdownItem>
                ))}
              </div>
            )}
          </Dropdown>

          {/* View toggle */}
          <div className="hidden items-center rounded-lg border border-ink-200 p-0.5 sm:flex">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => onViewChange("grid")}
              className={cn(
                "focus-ring flex h-8 w-8 items-center justify-center rounded-md",
                view === "grid" ? "bg-ink-100 text-ink-900" : "text-ink-400 hover:text-ink-700",
              )}
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
              className={cn(
                "focus-ring flex h-8 w-8 items-center justify-center rounded-md",
                view === "list" ? "bg-ink-100 text-ink-900" : "text-ink-400 hover:text-ink-700",
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips parsed={parsed} facets={facets} />

      {/* Mobile filter drawer */}
      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[90%] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <h2 className="text-base font-semibold text-ink-900">{t("filters")}</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <ProductFiltersPanel
                facets={facets}
                parsed={parsed}
                onNavigate={() => setMobileFiltersOpen(false)}
              />
            </div>
            <div className="border-t border-ink-100 p-3">
              <Button className="w-full" onClick={() => setMobileFiltersOpen(false)}>
                Show results
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Removable chips summarising the active filters. */
function ActiveFilterChips({
  parsed,
  facets,
}: {
  parsed: ParsedProductParams;
  facets: ProductFilters | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const removeParam = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of keys) params.delete(key);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/product?${qs}` : "/product", { scroll: false });
  };

  const chips: Array<{ label: string; onRemove: () => void }> = [];

  if (parsed.search) chips.push({ label: `“${parsed.search}”`, onRemove: () => removeParam(["search"]) });
  for (const id of parsed.categoryIds) {
    const facet = facets?.categories.find((c) => c.id === id);
    chips.push({ label: facet?.name ?? `Category #${id}`, onRemove: () => removeParam(["category"]) });
  }
  for (const id of parsed.brandIds) {
    const facet = facets?.brands.find((b) => b.id === id);
    chips.push({ label: facet?.name ?? `Brand #${id}`, onRemove: () => removeParam(["brand"]) });
  }
  if (parsed.vendorId) {
    const facet = facets?.vendors.find((v) => v.id === parsed.vendorId);
    chips.push({
      label: facet?.name ?? `Store #${parsed.vendorId}`,
      onRemove: () => removeParam(["vendor_id", "vendor"]),
    });
  }
  if (parsed.vendorSlug && !parsed.vendorId) {
    chips.push({ label: parsed.vendorSlug, onRemove: () => removeParam(["vendor"]) });
  }
  if (parsed.categorySlug && parsed.categoryIds.length === 0) {
    chips.push({ label: parsed.categorySlug, onRemove: () => removeParam(["category_slug"]) });
  }
  if (parsed.brandSlug && parsed.brandIds.length === 0) {
    chips.push({ label: parsed.brandSlug, onRemove: () => removeParam(["brand_slug"]) });
  }
  if (parsed.minRating) {
    chips.push({ label: `${parsed.minRating}★ & up`, onRemove: () => removeParam(["rating"]) });
  }
  if (parsed.minPrice || parsed.maxPrice) {
    chips.push({
      label: `Price ${parsed.minPrice ?? "0"}–${parsed.maxPrice ?? "∞"}`,
      onRemove: () => removeParam(["minPrice", "maxPrice"]),
    });
  }
  if (parsed.inStock) chips.push({ label: "In stock", onRemove: () => removeParam(["inStock"]) });
  if (parsed.attributeName) {
    chips.push({
      label: `${parsed.attributeName}=${parsed.attributeValue ?? ""}`,
      onRemove: () => removeParam(["attribute_name", "attribute_value"]),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, index) => (
        <span
          key={`${chip.label}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-ink-100 py-1 pl-3 pr-1 text-xs text-ink-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="focus-ring flex h-5 w-5 items-center justify-center rounded-full hover:bg-ink-200"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => router.push(buildProductHref({ search: parsed.search }), { scroll: false })}
        className="focus-ring rounded-full px-2 text-xs font-medium text-brand-700 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
