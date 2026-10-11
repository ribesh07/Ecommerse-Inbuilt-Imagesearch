"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WishlistToggle } from "./WishlistToggle";
import { Rating } from "@/components/ui/Rating";
import { CartIcon, CheckIcon, MinusIcon, PlusIcon, TruckIcon, ShieldCheckIcon, RefreshIcon } from "@/components/ui/icons";
import { useCart } from "@/context/CartContext";
import { useCountry } from "@/context/CountryContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLocale } from "@/context/LocaleContext";
import { discountPercent, formatNumber } from "@/lib/format";
import { availability, resolveDetailPrice } from "@/lib/product";
import { cn } from "@/lib/cn";
import type { ProductDetail, ProductVariant } from "@/lib/api/types";

/**
 * Purchase panel for the product detail page: price (country-aware), variant
 * selection, quantity and add-to-cart. Variants come from the API and carry
 * their own price/stock when present.
 */
export function ProductPurchasePanel({
  product,
  variants,
}: {
  product: ProductDetail;
  variants: ProductVariant[];
}) {
  const { countryCode, country } = useCountry();
  const { format } = useCurrency();
  const { language, t } = useLocale();
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  const price = resolveDetailPrice(product, countryCode);
  const variantPrice = selectedVariant
    ? { amount: Number.parseFloat(selectedVariant.price), currency: price?.currency ?? country.currency }
    : null;

  const effectiveAmount = variantPrice?.amount ?? price?.amount ?? 0;
  const effectiveCurrency = variantPrice?.currency ?? price?.currency ?? country.currency;
  const compare = variantPrice
    ? Number.parseFloat(selectedVariant?.compare_price ?? "0") || null
    : price?.comparePrice ?? null;

  const discount = discountPercent(effectiveAmount, compare);
  const stock = availability(selectedVariant?.stock ?? product.stock);

  const onAdd = () => {
    if (!stock.inStock) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: selectedVariant ? `${product.name} — ${selectedVariant.variant_name}` : product.name,
      slug: product.slug,
      thumbnail: product.images[0]?.thumbnail_url ?? null,
      unitPrice: effectiveAmount,
      comparePrice: compare,
      currency: effectiveCurrency,
      quantity,
      vendorId: product.vendors[0]?.id,
      vendorName: product.vendors[0]?.name ?? null,
      stock: selectedVariant?.stock ?? product.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const specs = product.specifications
    .filter((s) => s.language_code === language || s.language_code === "en")
    .filter((s, index, arr) => arr.findIndex((x) => x.specification_name === s.specification_name) === index);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {product.brand ? (
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
              {product.brand.name}
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{product.name}</h1>
        </div>
        <WishlistToggle productId={product.id} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Rating value={product.rating} count={product.review_count} size="md" />
        {product.review_count > 0 ? (
          <span className="text-xs text-ink-400">
            {formatNumber(product.review_count, language)} reviews
          </span>
        ) : null}
        <span className="text-xs text-ink-300">·</span>
        <span className="text-xs text-ink-400">SKU {product.sku}</span>
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold text-ink-900">
            {format(effectiveAmount, effectiveCurrency)}
          </span>
          {compare ? (
            <span className="text-base text-ink-400 line-through">
              {format(compare, effectiveCurrency)}
            </span>
          ) : null}
          {discount ? <Badge tone="danger">-{discount}%</Badge> : null}
        </div>
        {price?.converted ? (
          <p className="mt-1 text-xs text-amber-600">
            Approximate price converted for display. Final price is set by the API for your country.
          </p>
        ) : (
          <p className="mt-1 text-xs text-ink-400">Price shown for {country.name}</p>
        )}
      </div>

      {/* Availability + delivery */}
      <div className="flex flex-col gap-2 text-sm">
        <p className={cn("flex items-center gap-2 font-medium", stock.inStock ? "text-emerald-700" : "text-rose-600")}>
          {stock.inStock ? (
            <>
              <CheckIcon className="h-4 w-4" />
              {stock.lowStock ? `Only ${stock.stock} left in stock` : t("in_stock")}
            </>
          ) : (
            t("out_of_stock")
          )}
        </p>
        <p className="flex items-center gap-2 text-ink-500">
          <TruckIcon className="h-4 w-4 text-ink-400" />
          Delivery in {country.deliveryEstimate}
        </p>
      </div>

      {/* Variants */}
      {variants.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-800">Choose an option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selectedVariantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  aria-pressed={active}
                  className={cn(
                    "focus-ring rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    active ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:border-ink-300",
                  )}
                >
                  <span className="block font-medium">{variant.variant_name}</span>
                  <span className="block text-xs text-ink-500">
                    {format(variant.price, price?.currency ?? country.currency)}
                    {variant.stock === 0 ? " · unavailable" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Quantity + add to cart */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-ink-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-l-lg text-ink-600 hover:bg-ink-100"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock.stock || 99, q + 1))}
            aria-label="Increase quantity"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-r-lg text-ink-600 hover:bg-ink-100"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <Button
          size="lg"
          variant={added ? "secondary" : "primary"}
          onClick={onAdd}
          disabled={!stock.inStock}
          className="flex-1"
        >
          {added ? (
            <>
              <CheckIcon className="h-4 w-4" /> Added to cart
            </>
          ) : (
            <>
              <CartIcon className="h-4 w-4" /> {t("add_to_cart")}
            </>
          )}
        </Button>
      </div>

      {/* Trust row */}
      <div className="grid grid-cols-3 gap-3 border-t border-ink-100 pt-4 text-xs text-ink-500">
        <span className="flex flex-col items-center gap-1 text-center">
          <ShieldCheckIcon className="h-5 w-5 text-brand-600" /> Secure payment
        </span>
        <span className="flex flex-col items-center gap-1 text-center">
          <RefreshIcon className="h-5 w-5 text-brand-600" /> 7-day returns
        </span>
        <span className="flex flex-col items-center gap-1 text-center">
          <TruckIcon className="h-5 w-5 text-brand-600" /> Tracked delivery
        </span>
      </div>

      {specs.length > 0 ? (
        <div className="border-t border-ink-100 pt-4">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">Key specifications</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {specs.slice(0, 8).map((spec) => (
              <div key={spec.specification_name} className="flex justify-between gap-3 text-sm">
                <dt className="text-ink-500">{spec.specification_name}</dt>
                <dd className="font-medium text-ink-800">{spec.specification_value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
