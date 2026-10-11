"use client";

import type { ReactNode } from "react";
import { CountryProvider } from "./CountryContext";
import { CurrencyProvider } from "./CurrencyContext";
import { LocaleProvider } from "./LocaleContext";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";

/**
 * Single app-wide provider tree. Order matters: Country drives Currency and
 * Locale, so it must sit outermost. Cart and Wishlist are independent.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <CurrencyProvider>
        <LocaleProvider>
          <WishlistProvider>
            <CartProvider>{children}</CartProvider>
          </WishlistProvider>
        </LocaleProvider>
      </CurrencyProvider>
    </CountryProvider>
  );
}
