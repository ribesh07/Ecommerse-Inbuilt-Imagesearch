import { getFeaturedProducts } from "@/lib/api/products";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "./SectionHeading";
import { InlineNotice } from "./SectionHeading";

/**
 * "Featured for you" — top-rated products streamed from the API. Server
 * component so the data fetch and HTML stay on the server; wrapped in Suspense
 * by the home page and paired with a matching skeleton.
 */
export async function FeaturedProducts() {
  let products;
  try {
    products = await getFeaturedProducts({ limit: 8 }, { next: { revalidate: 300 } });
  } catch {
    return <InlineNotice tone="error" message="Unable to load featured products. Please refresh." />;
  }

  if (products.items.length === 0) {
    return <InlineNotice message="No featured products are available right now." />;
  }

  return (
    <section aria-labelledby="featured-heading">
      <SectionHeading
        title="Featured for you"
        subtitle="Handpicked, top-rated products across the marketplace"
        href="/product?sort=rating"
      />
      <ProductGrid products={products.items} priorityCount={4} />
    </section>
  );
}
