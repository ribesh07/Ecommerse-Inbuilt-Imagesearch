"use client";

import { useCallback } from "react";
import {
  createPersistentStore,
  parseJsonArray,
  usePersistentStore,
} from "@/lib/persistent-store";

/** Recent search terms, persisted client-side only. */

const KEY = "sukilo.recent-searches";
const MAX = 6;

const isString = (value: unknown): value is string => typeof value === "string";

const recentSearchesStore = createPersistentStore<string[]>(
  KEY,
  [],
  parseJsonArray(isString),
);

export function useRecentSearches() {
  const recent = usePersistentStore(recentSearchesStore);

  const add = useCallback((term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    recentSearchesStore.set((prev) =>
      [cleaned, ...prev.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, MAX),
    );
  }, []);

  const clear = useCallback(() => recentSearchesStore.set([]), []);

  return { recent, add, clear };
}
