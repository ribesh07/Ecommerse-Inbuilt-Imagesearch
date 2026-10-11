"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  createPersistentStore,
  parseJsonArray,
  usePersistentStore,
} from "@/lib/persistent-store";

/**
 * Wishlist-ready architecture. Persisted to localStorage today; the same
 * provider API can be backed by an authenticated wishlist endpoint later
 * without touching consumers.
 */

const STORAGE_KEY = "sukilo.wishlist";

const isNumber = (value: unknown): value is number => typeof value === "number";

const wishlistStore = createPersistentStore<number[]>(
  STORAGE_KEY,
  [],
  parseJsonArray(isNumber),
);

interface WishlistContextValue {
  ids: number[];
  count: number;
  has: (id: number) => boolean;
  toggle: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  ready: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const ids = usePersistentStore(wishlistStore);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      ready: true,
      has: (id) => ids.includes(id),
      toggle: (id) =>
        wishlistStore.set((prev) =>
          prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
        ),
      remove: (id) => wishlistStore.set((prev) => prev.filter((n) => n !== id)),
      clear: () => wishlistStore.set([]),
    }),
    [ids],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
