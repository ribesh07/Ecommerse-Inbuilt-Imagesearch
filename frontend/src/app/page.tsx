import { Suspense } from "react";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { PopularBrands } from "@/components/home/PopularBrands";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FlashDeals } from "@/components/home/FlashDeals";
import { RecommendedProducts } from "@/components/home/RecommendedProducts";
import { VendorShowcase } from "@/components/home/VendorShowcase";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { TrustBenefits } from "@/components/home/TrustBenefits";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { getNavCategories } from "@/lib/api/nav";
import { listBrands } from "@/lib/api/brands";
import { listVendors } from "@/lib/api/vendors";
import { getFeaturedProducts } from "@/lib/api/products";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { Brand, ProductListItem, Vendor } from "@/lib/api/types";
import type { NavCategory } from "@/lib/api/nav";

// Catalog data changes frequently; revalidate the shell every few minutes.
export const revalidate = 300;

export default async function HomePage() {
  const [categories, brands, vendors, hero] = await Promise.all([
    safe(() => getNavCategories(8), [] as NavCategory[]),
    safe(() => listBrands({ limit: 12 }).then((r) => r.items), [] as Brand[]),
    safe(() => listVendors({ limit: 6 }).then((r) => r.items), [] as Vendor[]),
    safe(() => getFeaturedProducts({ limit: 4 }).then((r) => r.items), [] as ProductListItem[]),
  ]);

  return (
    <div className="container-page space-y-12 py-6 sm:py-8">
      <Hero products={hero} />

      <FeaturedCategories categories={categories} />

      <PopularBrands brands={brands} />

      <Suspense fallback={<SectionSkeleton title="Featured for you" />}>
        <FeaturedProducts />
      </Suspense>

      <FlashDealsSection />

      <TrustBenefits />

      <Suspense fallback={<SectionSkeleton title="Recommended for you" />}>
        <RecommendedProducts />
      </Suspense>

      <VendorShowcase vendors={vendors} />

      <RecentlyViewedSection />

      <section className="rounded-2xl border border-ink-200 bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Ready to explore the marketplace?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-100">
          Browse products from verified vendors across all our markets, all in your local currency.
        </p>
        <Link
          href="/product"
          className="focus-ring mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          Shop all products
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

/** Wraps deals in a Suspense boundary with a skeleton fallback. */
function FlashDealsSection() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4 sm:p-6">
          <div className="h-6 w-40 rounded bg-ink-200 skeleton" />
          <div className="mt-4">
            <ProductGridSkeleton count={4} />
          </div>
        </div>
      }
    >
      <FlashDeals />
    </Suspense>
  );
}

function RecentlyViewedSection() {
  return (
    <Suspense fallback={null}>
      <RecentlyViewed />
    </Suspense>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section>
      <SectionHeading title={title} />
      <ProductGridSkeleton count={8} />
    </section>
  );
}

/** Awaits `fn`, returning `fallback` if it throws (keeps the page resilient). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
