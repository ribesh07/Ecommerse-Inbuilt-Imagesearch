import type { Metadata } from "next";
import { Suspense } from "react";
import { listVendors } from "@/lib/api/vendors";
import { VendorCard } from "@/components/vendors/VendorCard";
import { EmptyState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { StoreIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/filters/Pagination";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Stores & vendors",
  description:
    "Browse verified sellers on Sukilo. Discover stores from every market we operate in, with their product counts and locations.",
};

type PageProps = { searchParams: Promise<{ page?: string }> };

export default async function VendorsPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Stores & vendors</h1>
        <p className="mt-1 text-sm text-ink-500">
          Shop directly from verified sellers across our markets.
        </p>
      </header>

      <Suspense fallback={<VendorSkeletonGrid />}>
        <VendorList page={currentPage} />
      </Suspense>
    </div>
  );
}

async function VendorList({ page }: { page: number }) {
  let result;
  try {
    result = await listVendors({ page, limit: 24 }, { next: { revalidate: 600 } });
  } catch {
    return <EmptyState title="Unable to load stores" message="Please refresh the page and try again." />;
  }

  if (result.items.length === 0) {
    return (
      <EmptyState
        icon={<StoreIcon className="h-6 w-6" />}
        title="No stores found"
        message="There are no vendors to display right now."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
      <Pagination page={result.pagination.page} total={result.pagination.total} limit={result.pagination.limit} />
    </div>
  );
}

function VendorSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading stores">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
