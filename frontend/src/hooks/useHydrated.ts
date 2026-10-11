"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first hydration render, then `true` once
 * running on the client. Use it to render client-only UI without causing a
 * hydration mismatch — no `useEffect`/`setState` required.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
