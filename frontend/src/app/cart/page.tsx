"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon, AlertIcon } from "@/components/ui/icons";

/**
 * Cart page. The API has no cart/checkout endpoint, so this is a fully
 * client-side cart (persisted in localStorage) — clearly a front-end feature.
 *
 * TODO(backend): wire the "Proceed to checkout" action to a real order flow.
 */
export default function CartPage() {
  const { items, count, subtotal, removeItem, setQuantity, clear } = useCart();
  const { format, currencyCode } = useCurrency();

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">Your cart</h1>
        <EmptyState
          icon={<CartIcon className="h-6 w-6" />}
          title="Your cart is empty"
          message="Browse the marketplace and add products to your cart."
          action={
            <ButtonLink href="/product" size="sm">
              Start shopping
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Your cart <span className="text-base font-normal text-ink-400">({count})</span>
        </h1>
        <Button variant="ghost" size="sm" onClick={clear} className="text-rose-600 hover:bg-rose-50">
          <TrashIcon className="h-4 w-4" /> Clear cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white">
          {items.map((item) => (
            <li key={`${item.productId}:${item.variantId ?? "base"}`} className="flex gap-4 p-4">
              <Link
                href={`/product/${item.productId}`}
                className="focus-ring relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-50"
              >
                {item.thumbnail ? (
                  <Image src={item.thumbnail} alt={item.name} fill sizes="80px" className="object-cover" />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/product/${item.productId}`}
                    className="focus-ring line-clamp-2 rounded text-sm font-medium text-ink-900 hover:text-brand-700"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-rose-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {item.vendorName ? (
                  <p className="mt-0.5 text-xs text-ink-400">Sold by {item.vendorName}</p>
                ) : null}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-ink-200">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1, item.variantId)}
                      aria-label="Decrease quantity"
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-l-lg text-ink-600 hover:bg-ink-100"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1, item.variantId)}
                      aria-label="Increase quantity"
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-r-lg text-ink-600 hover:bg-ink-100"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    {format(item.unitPrice * item.quantity, item.currency)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-xl border border-ink-200 bg-white p-5">
            <h2 className="text-base font-semibold text-ink-900">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-medium text-ink-900">{format(subtotal, currencyCode)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Delivery</dt>
                <dd className="text-ink-500">Calculated at checkout</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-ink-100 pt-3 text-base">
                <dt className="font-semibold text-ink-900">Total</dt>
                <dd className="font-bold text-ink-900">{format(subtotal, currencyCode)}</dd>
              </div>
            </dl>

            <Button className="mt-5 w-full" size="lg" disabled>
              Proceed to checkout
            </Button>

            <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Checkout is not yet connected. The backend currently exposes no order or payment
                endpoint, so this cart is stored locally on your device.
              </p>
            </div>

            <Link
              href="/product"
              className="focus-ring mt-3 block rounded text-center text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
