"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { useCountry } from "@/context/CountryContext";
import { Button } from "@/components/ui/Button";
import { CartIcon, CheckIcon } from "@/components/ui/icons";
import { resolveListPrice } from "@/lib/product";
import { cn } from "@/lib/cn";
import type { ProductListItem } from "@/lib/api/types";

/** Add-to-cart action for a product card. Confirms briefly after adding. */
export function AddToCartButton({
  product,
  className,
  fullWidth = true,
}: {
  product: ProductListItem;
  className?: string;
  fullWidth?: boolean;
}) {
  const { addItem } = useCart();
  const { countryCode } = useCountry();
  const { t } = useLocale();
  const [added, setAdded] = useState(false);

  const price = resolveListPrice(product, countryCode);
  const inStock = product.stock > 0;

  const onAdd = () => {
    if (!inStock || !price) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      thumbnail: product.thumbnail,
      unitPrice: price.amount,
      comparePrice: price.comparePrice,
      currency: price.currency,
      stock: product.stock,
      vendorId: undefined,
      vendorName: null,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={added ? "secondary" : "primary"}
      onClick={onAdd}
      disabled={!inStock}
      aria-label={inStock ? `Add ${product.name} to cart` : "Out of stock"}
      className={cn(fullWidth && "w-full", className)}
    >
      {added ? (
        <>
          <CheckIcon className="h-4 w-4" /> Added
        </>
      ) : (
        <>
          <CartIcon className="h-4 w-4" />
          {inStock ? t("add_to_cart") : t("out_of_stock")}
        </>
      )}
    </Button>
  );
}
