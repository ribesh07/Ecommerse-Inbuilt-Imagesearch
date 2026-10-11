"use client";

import { useEffect, useRef, useState } from "react";
import { getSearchSuggestions, type SearchSuggestions } from "@/lib/api/search";
import { useDebounce } from "./useDebounce";

export interface UseSearchSuggestionsResult {
  suggestions: SearchSuggestions | null;
  loading: boolean;
  error: boolean;
}

/**
 * Debounced autocomplete for the search bar. Fires at most one request per
 * quiet period and ignores stale responses via an AbortController + request id.
 *
 * The result is only surfaced once the term is long enough; shorter terms are
 * derived as "inactive" rather than cleared with a synchronous effect setState.
 */
export function useSearchSuggestions(
  query: string,
  { debounce = 350, enabled = true }: { debounce?: number; enabled?: boolean } = {},
): UseSearchSuggestionsResult {
  const debounced = useDebounce(query.trim(), debounce);
  const active = enabled && debounced.length >= 2;

  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!active) return;

    const id = ++requestId.current;
    const controller = new AbortController();

    // All state updates happen asynchronously (network callbacks), never as a
    // synchronous effect side-effect.
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await getSearchSuggestions(debounced, {
          signal: controller.signal,
          next: { revalidate: 60 },
        });
        if (id === requestId.current) setSuggestions(result);
      } catch {
        if (!controller.signal.aborted && id === requestId.current) {
          setError(true);
          setSuggestions({ products: [], categories: [], brands: [] });
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debounced, active]);

  return {
    suggestions: active ? suggestions : null,
    loading: active ? loading : false,
    error: active ? error : false,
  };
}
