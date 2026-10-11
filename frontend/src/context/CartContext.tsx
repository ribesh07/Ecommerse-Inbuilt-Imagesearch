"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { createPersistentStore, usePersistentStore } from "@/lib/persistent-store";

/**
 * Cart-ready architecture. The reducer-free store already models variants,
 * vendors, per-item currency and stock so a future multi-vendor checkout
 * endpoint can consume it verbatim. Persisted to localStorage; the API exposes
 * no cart/order endpoint yet.
 */

export interface CartItem {
  productId: number;
  variantId?: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  /** Unit price captured at add-time, in the item's currency. */
  unitPrice: number;
  comparePrice: number | null;
  currency: string;
  quantity: number;
  vendorId?: number;
  vendorName?: string | null;
  stock: number;
}

const STORAGE_KEY = "sukilo.cart";

export function cartItemKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return `${item.productId}:${item.variantId ?? "base"}`;
}

const isCartItem = (value: unknown): value is CartItem =>
  typeof value === "object" &&
  value !== null &&
  "productId" in value &&
  "unitPrice" in value &&
  "quantity" in value;

const cartStore = createPersistentStore<CartItem[]>(
  STORAGE_KEY,
  [],
  (raw) => {
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isCartItem);
    } catch {
      return [];
    }
  },
);

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, variantId?: number) => void;
  setQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clear: () => void;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = usePersistentStore(cartStore);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const quantity = item.quantity ?? 1;
      cartStore.set((prev) => {
        const key = cartItemKey(item);
        const existing = prev.find((i) => cartItemKey(i) === key);
        if (existing) {
          return prev.map((i) =>
            cartItemKey(i) === key
              ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock || Infinity) }
              : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: number, variantId?: number) => {
    const key = cartItemKey({ productId, variantId });
    cartStore.set((prev) => prev.filter((i) => cartItemKey(i) !== key));
  }, []);

  const setQuantity = useCallback(
    (productId: number, quantity: number, variantId?: number) => {
      const key = cartItemKey({ productId, variantId });
      cartStore.set((prev) =>
        prev.map((i) =>
          cartItemKey(i) === key
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || Infinity)) }
            : i,
        ),
      );
    },
    [],
  );

  const clear = useCallback(() => cartStore.set([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return { items, count, subtotal, addItem, removeItem, setQuantity, clear, ready: true };
  }, [items, addItem, removeItem, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
