"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCountry } from "@/context/CountryContext";
import { getProduct } from "@/lib/api/products";
import { ButtonLink } from "@/components/ui/Button";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { HeartIcon, TrashIcon } from "@/components/ui/icons";
import { resolveDetailPrice } from "@/lib/product";
import type { ProductDetail } from "@/lib/api/types";

/**
 * Wishlist page. IDs are stored client-side; each product's details are fetched
 * from the API on demand. Renders loading, empty and error states.
 */
export default function WishlistPage() {
  const { ids, ready, remove } = useWishlist();
  const { format } = useCurrency();
  const { countryCode } = useCountry();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready || ids.length === 0) return;
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const results = await Promise.all(
          ids.map((id) => getProduct(id, { signal: controller.signal }).catch(() => null)),
        );
        if (cancelled) return;
        const valid = results.filter((p): p is ProductDetail => p !== null);
        setProducts(valid);
        setError(valid.length === 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ids, ready]);

  const showLoading = !ready || (ids.length > 0 && loading);
  const showEmpty = ready && ids.length === 0;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">Your wishlist</h1>

      {showLoading ? (
        <ProductGridSkeleton count={4} />
      ) : showEmpty ? (
        <EmptyState
          icon={<HeartIcon className="h-6 w-6" />}
          title="Your wishlist is empty"
          message="Save products you love by tapping the heart icon on any product."
          action={
            <ButtonLink href="/product" size="sm">
              Browse products
            </ButtonLink>
          }
        />
      ) : error ? (
        <EmptyState title="Unable to load wishlist" message="Please refresh the page and try again." />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const price = resolveDetailPrice(product, countryCode);
            const image = product.images[0]?.thumbnail_url ?? null;
            return (
              <li
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink-200 bg-white"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="focus-ring relative aspect-square bg-ink-50"
                >
                  {image ? (
                    <Image src={image} alt={product.name} fill sizes="25vw" className="object-cover" />
                  ) : null}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="focus-ring absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-500 hover:text-rose-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <div className="flex flex-1 flex-col p-3">
                  <Link
                    href={`/product/${product.id}`}
                    className="focus-ring line-clamp-2 rounded text-sm font-medium text-ink-900 hover:text-brand-700"
                  >
                    {product.name}
                  </Link>
                  {price ? (
                    <span className="mt-1.5 text-base font-bold text-ink-900">
                      {format(price.amount, price.currency)}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
