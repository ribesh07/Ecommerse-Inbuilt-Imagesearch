import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ProductFiltersPanel } from "@/components/filters/ProductFiltersPanel";
import { ResultsView } from "@/components/filters/ResultsView";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { PackageIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/Button";
import { listProducts } from "@/lib/api/products";
import { getProductFilters } from "@/lib/api/categories";
import { resolveFilterIds } from "@/lib/api/resolve";
import {
  parseProductParams,
  toProductQuery,
  type RawSearchParams,
} from "@/lib/search-params";
import type { ProductFilters } from "@/lib/api/types";

// The listing is entirely searchParams-driven, so it is rendered per request.
// Individual data fetches use short revalidate windows for caching.
type PageProps = {
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const parsed = parseProductParams(await searchParams);
  const descriptor = describeFilters(parsed);

  const title = descriptor ? `${descriptor} — Shop online` : "All products";
  const description = descriptor
    ? `Browse ${descriptor.toLowerCase()} from trusted vendors. Compare prices, ratings and availability in your local currency.`
    : "Browse products from thousands of verified vendors. Filter by category, brand, store, price, rating and availability.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function ProductPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = parseProductParams(raw);

  // Resolve readable slugs (e.g. ?brand=apple) to API ids.
  const resolved = await resolveFilterIds(parsed);
  const query = toProductQuery(parsed, {
    category_ids: resolved.categoryIds.length ? resolved.categoryIds : undefined,
    brand_ids: resolved.brandIds.length ? resolved.brandIds : undefined,
    vendor_id: resolved.vendorId,
  });

  const [productsResult, facets] = await Promise.all([
    listProducts(query, { next: { revalidate: 60 } })
      .then((data) => ({ ok: true as const, data }))
      .catch(() => ({ ok: false as const, data: null })),
    getProductFilters(
      {
        category_id: resolved.categoryIds[0],
        brand_id: resolved.brandIds[0],
        min_price: parsed.minPrice,
        max_price: parsed.maxPrice,
        q: parsed.search || undefined,
      },
      { next: { revalidate: 120 } },
    ).catch((): ProductFilters | null => null),
  ]);

  const heading = describeFilters(parsed) ?? "All products";

  return (
    <div className="container-page py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-ink-400">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="focus-ring rounded hover:text-ink-700">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-700" aria-current="page">
            {heading}
          </li>
        </ol>
      </nav>

      <h1 className="sr-only">{heading}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-ink-200 bg-white p-4">
            <h2 className="mb-1 text-base font-semibold text-ink-900">Filters</h2>
            <ProductFiltersPanel facets={facets} parsed={parsed} />
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0">
          {!productsResult.ok || !productsResult.data ? (
            <ErrorState
              title="Unable to load products"
              message="We couldn't reach the marketplace. Please check your connection and try again."
            />
          ) : productsResult.data.items.length === 0 ? (
            <div className="space-y-4">
              <Suspense fallback={null}>
                <ResultsView
                  products={[]}
                  total={0}
                  limit={query.limit ?? 24}
                  parsed={parsed}
                  facets={facets}
                />
              </Suspense>
              <EmptyState
                icon={<PackageIcon className="h-6 w-6" />}
                title="No products found"
                message={
                  parsed.search
                    ? `We couldn't find anything for “${parsed.search}”. Try a different search or adjust your filters.`
                    : "No products match the selected filters. Try removing some filters."
                }
                action={
                  <ButtonLink href="/product" variant="outline" size="sm">
                    Clear filters
                  </ButtonLink>
                }
              />
            </div>
          ) : (
            <Suspense fallback={<ProductGridSkeleton count={12} />}>
              <ResultsView
                products={productsResult.data.items}
                total={productsResult.data.pagination.total}
                limit={productsResult.data.pagination.limit}
                parsed={parsed}
                facets={facets}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

/** Human-readable description of the active filters (used for the H1/title). */
function describeFilters(parsed: ReturnType<typeof parseProductParams>): string | null {
  if (parsed.search) return `Search results for “${parsed.search}”`;
  if (parsed.categorySlug) return titleCase(parsed.categorySlug.replace(/-/g, " "));
  if (parsed.categoryIds.length === 1) return `Category #${parsed.categoryIds[0]}`;
  if (parsed.brandSlug) return titleCase(parsed.brandSlug.replace(/-/g, " "));
  if (parsed.brandIds.length === 1) return `Brand products`;
  if (parsed.vendorSlug) return `${titleCase(parsed.vendorSlug.replace(/-/g, " "))} store`;
  if (parsed.vendorId) return `Store products`;
  return null;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
