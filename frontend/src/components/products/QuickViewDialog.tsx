"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { AddToCartButton } from "./AddToCartButton";
import { ButtonLink } from "@/components/ui/Button";
import { resolveListPrice } from "@/lib/product";
import { discountPercent } from "@/lib/format";
import { useCountry } from "@/context/CountryContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLocale } from "@/context/LocaleContext";
import { productName, productShortDescription } from "@/lib/product";
import type { ProductListItem } from "@/lib/api/types";

/** Quick-view dialog: a fast summary of a product without leaving the grid. */
export function QuickViewDialog({
  product,
  open,
  onClose,
}: {
  product: ProductListItem;
  open: boolean;
  onClose: () => void;
}) {
  const { countryCode } = useCountry();
  const { format } = useCurrency();
  const { language, t } = useLocale();

  const price = resolveListPrice(product, countryCode);
  const discount = discountPercent(product.price.amount, product.compare_price);
  const description = productShortDescription(product, language);

  return (
    <Modal open={open} onClose={onClose} title="Quick view" className="sm:max-w-2xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-100">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={productName(product, language)}
              fill
              sizes="(max-width: 640px) 90vw, 320px"
              className="object-cover"
            />
          ) : null}
          {discount ? (
            <span className="absolute left-3 top-3">
              <Badge tone="danger">-{discount}%</Badge>
            </span>
          ) : null}
        </div>

        <div className="flex flex-col">
          {product.brand?.name ? (
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              {product.brand.name}
            </p>
          ) : null}
          <h3 className="mt-1 text-lg font-semibold text-ink-900">{productName(product, language)}</h3>
          {product.rating ? <Rating value={product.rating} className="mt-2" /> : null}
          {description ? (
            <p className="mt-3 line-clamp-3 text-sm text-ink-500">{description}</p>
          ) : null}

          <div className="mt-4 flex items-baseline gap-2">
            {price ? (
              <span className="text-2xl font-bold text-ink-900">{format(price.amount, price.currency)}</span>
            ) : null}
            {price?.comparePrice ? (
              <span className="text-sm text-ink-400 line-through">
                {format(price.comparePrice, price.currency)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {product.stock > 0 ? t("in_stock") : t("out_of_stock")}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <AddToCartButton product={product} />
            <ButtonLink href={`/product/${product.id}`} variant="outline" onClick={onClose}>
              View full details
            </ButtonLink>
          </div>
        </div>
      </div>
    </Modal>
  );
}
