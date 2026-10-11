import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Route-level loading UI for the product listing page. */
export default function Loading() {
  return (
    <div className="container-page py-6">
      <Skeleton className="mb-3 h-4 w-48" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="space-y-3 rounded-xl border border-ink-200 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </aside>
        <div className="min-w-0 space-y-4">
          <Skeleton className="h-14 w-full" />
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
}
