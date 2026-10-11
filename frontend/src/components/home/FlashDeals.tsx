import Link from "next/link";
import { getLatestProducts } from "@/lib/api/products";
import { ProductRail } from "@/components/products/ProductRail";
import { InlineNotice } from "./SectionHeading";
import { ArrowRightIcon, SparkleIcon } from "@/components/ui/icons";
import { discountPercent } from "@/lib/format";

/**
 * Flash/deals section. The API has no dedicated "deals" endpoint, so we take the
 * latest products and surface the ones that actually carry a compare price — a
 * genuine discount as reported by the backend, never fabricated.
 */
export async function FlashDeals() {
  let products;
  try {
    products = await getLatestProducts({ limit: 24 }, { next: { revalidate: 300 } });
  } catch {
    return <InlineNotice tone="error" message="Unable to load deals right now." />;
  }

  const deals = products.items
    .filter((product) => discountPercent(product.price.amount, product.compare_price) !== null)
    .slice(0, 10);

  if (deals.length === 0) {
    // No discounted items in the latest batch — hide rather than show noise.
    return null;
  }

  return (
    <section aria-labelledby="deals-heading" className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink-900">Today&apos;s deals</h2>
            <p className="text-sm text-ink-500">Limited-time savings on fresh arrivals</p>
          </div>
        </div>
        <Link
          href="/product?sort=price_asc"
          className="focus-ring flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          See all
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      <ProductRail products={deals} />
    </section>
  );
}
