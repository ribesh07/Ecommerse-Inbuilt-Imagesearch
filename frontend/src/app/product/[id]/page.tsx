import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProductReviews, getProductVariants } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { localizedDescription } from "@/lib/product";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductPurchasePanel } from "@/components/products/ProductPurchasePanel";
import { ProductReviews, ProductVendors } from "@/components/products/ProductReviews";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { RecentlyViewedTracker } from "@/components/products/RecentlyViewedTracker";
import { discountPercent } from "@/lib/format";
import type { ProductListItem } from "@/lib/api/types";

// Revalidate product pages periodically; dynamic content is per-id.
export const revalidate = 300;

type PageProps = { params: Promise<{ id: string }> };

// `cache` memoises the fetch so generateMetadata + the page share one request.
const loadProduct = cache(async (id: number) => {
  try {
    return await getProduct(id, { next: { revalidate: 300 } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return { title: "Product not found" };

  const product = await loadProduct(numericId);
  if (!product) return { title: "Product not found" };

  const englishDescription = localizedDescription(product.descriptions, "en");
  const description =
    englishDescription?.short_description ??
    product.short_description ??
    `Buy ${product.name} online at Sukilo.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: product.images[0]?.image_url ? [{ url: product.images[0].image_url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  let product;
  try {
    product = await loadProduct(numericId);
  } catch {
    throw new Error("Unable to load this product. Please try again later.");
  }
  if (!product) notFound();

  const [variants, reviews] = await Promise.all([
    getProductVariants(numericId, { next: { revalidate: 300 } }).catch(() => []),
    getProductReviews(numericId, { page: 1, limit: 8 }, { next: { revalidate: 120 } }).catch(() => ({
      items: [],
      pagination: { limit: 8, page: 1, total: 0, has_next: false },
    })),
  ]);

  const discount = discountPercent(product.price, product.compare_price);

  // Compact snapshot for the recently-viewed rail.
  const snapshot: ProductListItem = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
    category: product.category ? { id: product.category.id, name: product.category.name } : null,
    price: { amount: product.price, currency: "NPR" },
    thumbnail: product.images[0]?.thumbnail_url ?? null,
    rating: product.rating,
    stock: product.stock,
    compare_price: product.compare_price,
    short_description: product.short_description,
  };

  return (
    <div className="container-page py-6">
      <RecentlyViewedTracker product={snapshot} />

      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="focus-ring rounded hover:text-ink-700">
              Home
            </Link>
          </li>
          {product.category ? (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/product?category=${product.category.id}`}
                  className="focus-ring rounded hover:text-ink-700"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden>/</li>
          <li className="line-clamp-1 text-ink-700" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
          badge={discount ? <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">-{discount}%</span> : null}
        />
        <ProductPurchasePanel product={product} variants={variants} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="text-lg font-bold text-ink-900">
              Product description
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-600">
              {localizedDescription(product.descriptions, "en")?.description ||
              product.description ||
              "No description available for this product."}
            </div>
          </section>

          <section aria-labelledby="reviews-heading" className="mt-10">
            <h2 id="reviews-heading" className="mb-4 text-lg font-bold text-ink-900">
              Customer reviews
            </h2>
            <ProductReviews summary={product.review_summary} reviews={reviews.items} language="en" />
          </section>
        </div>

        <aside className="space-y-4">
          <ProductVendors vendors={product.vendors} language="en" />
          {product.specifications.length > 0 ? (
            <div className="rounded-xl border border-ink-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink-900">Specifications</h2>
              <dl className="space-y-2">
                {product.specifications
                  .filter((s) => s.language_code === "en")
                  .map((spec) => (
                    <div key={spec.specification_name} className="flex justify-between gap-3 text-sm">
                      <dt className="text-ink-500">{spec.specification_name}</dt>
                      <dd className="text-right font-medium text-ink-800">{spec.specification_value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="mt-12">
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  );
}
