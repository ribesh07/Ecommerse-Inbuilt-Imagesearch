"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { WishlistToggle } from "./WishlistToggle";
import { AddToCartButton } from "./AddToCartButton";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { useCountry } from "@/context/CountryContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLocale } from "@/context/LocaleContext";
import { discountPercent } from "@/lib/format";
import {
  availability,
  productName,
  productShortDescription,
  resolveListPrice,
} from "@/lib/product";
import type { ProductListItem } from "@/lib/api/types";

/** Grid layout of product cards. */
export function ProductResultsGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/** Horizontal list layout used by the toolbar's list view toggle. */
export function ProductResultsList({ products }: { products: ProductListItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {products.map((product) => (
        <ListProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ListProductCard({ product }: { product: ProductListItem }) {
  const { countryCode, country } = useCountry();
  const { format } = useCurrency();
  const { language } = useLocale();

  const name = productName(product, language);
  const description = productShortDescription(product, language);
  const price = resolveListPrice(product, countryCode);
  const discount = discountPercent(product.price.amount, product.compare_price);
  const stock = availability(product.stock);

  return (
    <article className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-ink-200 bg-white p-3 transition-shadow hover:shadow-md sm:flex-row">
      <Link
        href={`/product/${product.id}`}
        className="focus-ring relative aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-ink-50 sm:h-40 sm:w-40"
        aria-label={name}
      >
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt={name} fill sizes="160px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {product.brand?.name ? (
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                {product.brand.name}
              </p>
            ) : null}
            <h3 className="line-clamp-2 text-sm font-medium text-ink-900">
              <Link href={`/product/${product.id}`} className="focus-ring rounded hover:text-brand-700">
                {name}
              </Link>
            </h3>
          </div>
          <WishlistToggle productId={product.id} size="sm" />
        </div>

        {description ? <p className="mt-1 line-clamp-2 text-xs text-ink-500">{description}</p> : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {product.rating ? <Rating value={product.rating} /> : null}
          {discount ? <Badge tone="danger">-{discount}%</Badge> : null}
          {!stock.inStock ? <Badge tone="neutral">Out of stock</Badge> : null}
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              {price ? (
                <span className="text-lg font-bold text-ink-900">{format(price.amount, price.currency)}</span>
              ) : null}
              {price?.comparePrice ? (
                <span className="text-xs text-ink-400 line-through">
                  {format(price.comparePrice, price.currency)}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-ink-400">{country.deliveryEstimate}</p>
          </div>
          <AddToCartButton product={product} fullWidth={false} className="min-w-36" />
        </div>
      </div>
    </article>
  );
}
