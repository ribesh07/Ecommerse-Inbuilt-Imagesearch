"use client";

import { useSyncExternalStore } from "react";

/** Tracks a CSS media query. SSR-safe: the server snapshot is always false. */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onStoreChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onStoreChange);
    return () => mql.removeEventListener("change", onStoreChange);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True on viewports below the Tailwind `lg` breakpoint (1024px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
