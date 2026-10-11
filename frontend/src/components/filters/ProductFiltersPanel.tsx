"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, StarIcon, CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/context/LocaleContext";
import { useCurrency } from "@/context/CurrencyContext";
import { buildProductHref, type ParsedProductParams } from "@/lib/search-params";
import { cn } from "@/lib/cn";
import type { ProductFilters } from "@/lib/api/types";

/**
 * Faceted filter panel. Every control maps to a real, API-supported query
 * parameter (see `/api/v1/products`). Selecting a filter rewrites the listing
 * URL, which the server component re-reads — the URL is the single source of
 * truth and results stay shareable/linkable.
 */
export function ProductFiltersPanel({
  facets,
  parsed,
  onNavigate,
}: {
  facets: ProductFilters | null;
  parsed: ParsedProductParams;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const { format, currencyCode } = useCurrency();

  const apply = (partial: Partial<ParsedProductParams>) => {
    const href = buildProductHref({ ...parsed, page: 1, ...partial });
    router.push(href, { scroll: false });
    onNavigate?.();
  };

  const toggleId = (key: "categoryIds" | "brandIds", id: number) => {
    const current = parsed[key];
    const next = current.includes(id) ? current.filter((n) => n !== id) : [...current, id];
    // Clear slug counterparts when switching to explicit id selection.
    apply(
      key === "categoryIds"
        ? { categoryIds: next, categorySlug: undefined }
        : { brandIds: next, brandSlug: undefined },
    );
  };

  if (!facets) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-lg bg-ink-100 skeleton" />
        ))}
        <p className="text-xs text-ink-400">Filters are loading…</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-ink-100">
      <FacetSection title="Category">
        {facets.categories.length === 0 ? (
          <FacetEmpty />
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {facets.categories.map((item) => (
              <FacetCheck
                key={item.id}
                label={item.name}
                count={item.count}
                checked={parsed.categoryIds.includes(item.id)}
                onChange={() => toggleId("categoryIds", item.id)}
              />
            ))}
          </ul>
        )}
      </FacetSection>

      <FacetSection title="Brand">
        {facets.brands.length === 0 ? (
          <FacetEmpty />
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {facets.brands.map((item) => (
              <FacetCheck
                key={item.id}
                label={item.name}
                count={item.count}
                checked={parsed.brandIds.includes(item.id)}
                onChange={() => toggleId("brandIds", item.id)}
              />
            ))}
          </ul>
        )}
      </FacetSection>

      <FacetSection title="Store">
        {facets.vendors.length === 0 ? (
          <FacetEmpty />
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {facets.vendors.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    apply({
                      vendorId: parsed.vendorId === item.id ? undefined : item.id,
                      vendorSlug: undefined,
                    })
                  }
                  className={cn(
                    "focus-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    parsed.vendorId === item.id ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      parsed.vendorId === item.id ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300",
                    )}
                  >
                    {parsed.vendorId === item.id ? <CheckIcon className="h-3 w-3" /> : null}
                  </span>
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-ink-400">{item.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </FacetSection>

      <FacetSection title="Price">
        <PriceFilter
          key={`${parsed.minPrice ?? ""}-${parsed.maxPrice ?? ""}`}
          parsed={parsed}
          bounds={facets.price}
          currencyCode={currencyCode}
          onApply={(min, max) => apply({ minPrice: min, maxPrice: max })}
          formatValue={(value) => format(value, currencyCode)}
        />
      </FacetSection>

      <FacetSection title="Customer rating">
        <ul className="space-y-0.5">
          {[4, 3, 2].map((rating) => (
            <li key={rating}>
              <button
                type="button"
                onClick={() =>
                  apply({ minRating: parsed.minRating === rating ? undefined : rating })
                }
                className={cn(
                  "focus-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  parsed.minRating === rating ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50",
                )}
              >
                <span className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} className="h-3.5 w-3.5" filled={star <= rating} />
                  ))}
                </span>
                <span>& up</span>
              </button>
            </li>
          ))}
        </ul>
      </FacetSection>

      <FacetSection title="Availability">
        <FacetCheck
          label={t("in_stock")}
          checked={parsed.inStock}
          onChange={() => apply({ inStock: !parsed.inStock })}
        />
      </FacetSection>

      <FacetSection title="Attributes" defaultOpen={false}>
        <AttributeFilter parsed={parsed} onApply={(name, value) => apply({ attributeName: name, attributeValue: value })} />
      </FacetSection>
    </div>
  );
}

function FacetSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring mb-2 flex w-full items-center justify-between rounded text-sm font-semibold text-ink-900"
      >
        {title}
        <ChevronDownIcon className={cn("h-4 w-4 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="pb-1">{children}</div> : null}
    </section>
  );
}

function FacetCheck({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={cn(
          "focus-ring flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
          checked ? "text-brand-700" : "text-ink-600 hover:bg-ink-50",
        )}
      >
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            checked ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300",
          )}
        >
          {checked ? <CheckIcon className="h-3 w-3" /> : null}
        </span>
        <span className="flex-1 truncate">{label}</span>
        {typeof count === "number" ? <span className="text-xs text-ink-400">{count}</span> : null}
      </button>
    </li>
  );
}

function FacetEmpty() {
  return <p className="px-2 text-xs text-ink-400">No options for the current selection.</p>;
}

function PriceFilter({
  parsed,
  bounds,
  currencyCode,
  onApply,
  formatValue,
}: {
  parsed: ParsedProductParams;
  bounds: { min: number; max: number };
  currencyCode: string;
  onApply: (min?: number, max?: number) => void;
  formatValue: (value: number) => string;
}) {
  const [min, setMin] = useState(parsed.minPrice?.toString() ?? "");
  const [max, setMax] = useState(parsed.maxPrice?.toString() ?? "");

  const minRounded = Math.floor(bounds.min);
  const maxRounded = Math.ceil(bounds.max);

  return (
    <div className="space-y-2">
      <p className="px-2 text-xs text-ink-400">
        {formatValue(minRounded)} – {formatValue(maxRounded)}
      </p>
      <div className="flex items-center gap-2 px-2">
        <input
          type="number"
          inputMode="numeric"
          value={min}
          min={0}
          onChange={(event) => setMin(event.target.value)}
          placeholder="Min"
          aria-label="Minimum price"
          className="focus-ring h-9 w-full rounded-lg border border-ink-200 px-2 text-sm outline-none"
        />
        <span className="text-ink-300">–</span>
        <input
          type="number"
          inputMode="numeric"
          value={max}
          min={0}
          onChange={(event) => setMax(event.target.value)}
          placeholder="Max"
          aria-label="Maximum price"
          className="focus-ring h-9 w-full rounded-lg border border-ink-200 px-2 text-sm outline-none"
        />
      </div>
      <div className="px-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() =>
            onApply(
              min ? Number.parseFloat(min) : undefined,
              max ? Number.parseFloat(max) : undefined,
            )
          }
        >
          Apply price
        </Button>
      </div>
      {currencyCode ? (
        <p className="px-2 text-[11px] text-ink-400">
          Prices are in {currencyCode}. Country pricing is applied by the API.
        </p>
      ) : null}
    </div>
  );
}

function AttributeFilter({
  parsed,
  onApply,
}: {
  parsed: ParsedProductParams;
  onApply: (name?: string, value?: string) => void;
}) {
  const [name, setName] = useState(parsed.attributeName ?? "");
  const [value, setValue] = useState(parsed.attributeValue ?? "");

  return (
    <div className="space-y-2 px-2">
      <p className="text-xs text-ink-400">
        Filter by product specification (e.g. <em>Color</em> = <em>Blue</em>).
      </p>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Attribute name"
        aria-label="Attribute name"
        className="focus-ring h-9 w-full rounded-lg border border-ink-200 px-2 text-sm outline-none"
      />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Attribute value"
        aria-label="Attribute value"
        className="focus-ring h-9 w-full rounded-lg border border-ink-200 px-2 text-sm outline-none"
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => onApply(name || undefined, value || undefined)}
      >
        Apply attribute
      </Button>
    </div>
  );
}
