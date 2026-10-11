import { getRelatedProducts } from "@/lib/api/products";
import { ProductRail } from "@/components/products/ProductRail";
import { SectionHeading } from "@/components/home/SectionHeading";
import { InlineNotice } from "@/components/home/SectionHeading";

/**
 * Related products (same category), fetched by the server from
 * `/products/{id}/related`. Hidden when there are none.
 */
export async function RelatedProducts({ productId }: { productId: number }) {
  let related;
  try {
    related = await getRelatedProducts(productId, 10, { next: { revalidate: 300 } });
  } catch {
    return <InlineNotice tone="error" message="Unable to load related products." />;
  }

  if (related.items.length === 0) return null;

  return (
    <section aria-labelledby="related-heading">
      <SectionHeading title="You may also like" subtitle="Similar products from this category" />
      <ProductRail products={related.items} />
    </section>
  );
}
