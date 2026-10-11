"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchByImage } from "@/lib/api/search";
import { ApiError } from "@/lib/api/client";
import type { ProductListItem } from "@/lib/api/types";

/**
 * Image-search UI state machine. Handles file selection, client-side
 * validation, preview generation and submission to the `searchByImage`
 * service.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export type ImageSearchStatus = "idle" | "ready" | "searching" | "success" | "empty" | "error";

export interface UseImageSearchResult {
  status: ImageSearchStatus;
  previewUrl: string | null;
  fileName: string | null;
  error: string | null;
  results: ProductListItem[];
  selectFile: (file: File) => void;
  clear: () => void;
  search: () => Promise<void>;
}

export function useImageSearch(): UseImageSearchResult {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ImageSearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductListItem[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revoke, [revoke]);

  const selectFile = useCallback(
    (next: File) => {
      if (!ALLOWED_TYPES.includes(next.type as (typeof ALLOWED_TYPES)[number])) {
        setStatus("error");
        setError("Unsupported file type. Please choose a JPG, JPEG, PNG or WEBP image.");
        return;
      }
      if (next.size > MAX_BYTES) {
        setStatus("error");
        setError("Image is too large. Please choose a file under 8MB.");
        return;
      }
      revoke();
      const url = URL.createObjectURL(next);
      objectUrlRef.current = url;
      setFile(next);
      setPreviewUrl(url);
      setResults([]);
      setError(null);
      setStatus("ready");
    },
    [revoke],
  );

  const clear = useCallback(() => {
    revoke();
    setFile(null);
    setPreviewUrl(null);
    setResults([]);
    setError(null);
    setStatus("idle");
  }, [revoke]);

  const search = useCallback(async () => {
    if (!file) return;
    setStatus("searching");
    setError(null);
    try {
      const page = await searchByImage(file);
      if (page.items.length === 0) {
        setResults([]);
        setStatus("empty");
      } else {
        setResults(page.items);
        setStatus("success");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setStatus("error");
        setError(err.message);
      } else if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("ready");
      } else {
        setStatus("error");
        setError("Image search failed. Please try again.");
      }
    }
  }, [file]);

  return { status, previewUrl, fileName: file?.name ?? null, error, results, selectFile, clear, search };
}
