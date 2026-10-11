import { listProducts } from "@/lib/api/products";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "./SectionHeading";
import { InlineNotice } from "./SectionHeading";

/**
 * Recommended products — most popular items based on the API's popularity sort.
 * Server component; streamed behind a Suspense boundary on the home page.
 */
export async function RecommendedProducts() {
  let products;
  try {
    products = await listProducts({ sort: "popularity", limit: 8 }, { next: { revalidate: 300 } });
  } catch {
    return <InlineNotice tone="error" message="Unable to load recommendations." />;
  }

  if (products.items.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading">
      <SectionHeading
        title="Recommended for you"
        subtitle="What shoppers are loving this week"
        href="/product?sort=popularity"
      />
      <ProductGrid products={products.items} />
    </section>
  );
}
