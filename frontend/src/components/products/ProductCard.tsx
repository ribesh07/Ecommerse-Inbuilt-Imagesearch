"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WishlistToggle } from "./WishlistToggle";
import { AddToCartButton } from "./AddToCartButton";
import { QuickViewDialog } from "./QuickViewDialog";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { EyeIcon, TruckIcon } from "@/components/ui/icons";
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
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { cn } from "@/lib/cn";
import type { ProductListItem } from "@/lib/api/types";

/**
 * Reusable product card. Every optional field is rendered only when the API
 * provides data. Images use next/image with fixed aspect ratios to prevent CLS.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductListItem;
  priority?: boolean;
  className?: string;
}) {
  const { countryCode, country } = useCountry();
  const { format } = useCurrency();
  const { language } = useLocale();
  const [quickView, setQuickView] = useState(false);

  const name = productName(product, language);
  const description = productShortDescription(product, language);
  const price = resolveListPrice(product, countryCode);
  const discount = discountPercent(product.price.amount, product.compare_price);
  const stock = availability(product.stock);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink-200 bg-white transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="relative">
        <Link
          href={`/product/${product.id}`}
          onClick={() => addRecentlyViewed(product)}
          className="focus-ring block aspect-square overflow-hidden bg-ink-50"
          aria-label={name}
        >
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-ink-400">
              No image
            </span>
          )}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount ? <Badge tone="danger">-{discount}%</Badge> : null}
          {!stock.inStock ? <Badge tone="neutral">Out of stock</Badge> : null}
          {stock.lowStock ? <Badge tone="warning">Only {stock.stock} left</Badge> : null}
        </div>

        <div className="absolute right-2 top-2">
          <WishlistToggle productId={product.id} />
        </div>

        {/* Quick view */}
        <button
          type="button"
          onClick={() => setQuickView(true)}
          aria-label={`Quick view ${name}`}
          className="focus-ring absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-600 opacity-0 backdrop-blur transition-opacity hover:text-brand-700 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        {product.brand?.name ? (
          <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">
            {product.brand.name}
          </p>
        ) : null}

        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-ink-900">
          <Link href={`/product/${product.id}`} onClick={() => addRecentlyViewed(product)} className="focus-ring rounded hover:text-brand-700">
            {name}
          </Link>
        </h3>

        {description ? (
          <p className="mt-1 line-clamp-2 hidden text-xs text-ink-500 sm:block">{description}</p>
        ) : null}

        {product.rating ? <Rating value={product.rating} className="mt-1.5" /> : null}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {price ? (
            <span className="text-base font-bold text-ink-900">{format(price.amount, price.currency)}</span>
          ) : (
            <span className="text-sm text-ink-400">Price unavailable</span>
          )}
          {price?.comparePrice ? (
            <span className="text-xs text-ink-400 line-through">
              {format(price.comparePrice, price.currency)}
            </span>
          ) : null}
        </div>

        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-400">
          <TruckIcon className="h-3.5 w-3.5" />
          {country.deliveryEstimate}
        </p>

        <div className="mt-3 pt-1">
          <AddToCartButton product={product} />
        </div>
      </div>

      <QuickViewDialog product={product} open={quickView} onClose={() => setQuickView(false)} />
    </article>
  );
}
