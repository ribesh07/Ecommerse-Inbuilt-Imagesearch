"use client";

import { useRef } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CameraIcon, SpinnerIcon, TrashIcon, AlertIcon, SearchIcon } from "@/components/ui/icons";
import { useImageSearch } from "@/hooks/useImageSearch";

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

/**
 * Image search dialog: pick → preview → remove → submit. Results are rendered
 * inline using the existing product data shape (thumbnail, name, similarity).
 */
export function ImageSearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, previewUrl, fileName, error, results, selectFile, clear, search } = useImageSearch();

  return (
    <Modal open={open} onClose={onClose} title="Search by image">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          Upload a photo and we&apos;ll find visually similar products. Supported formats: JPG, JPEG,
          PNG, WEBP.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="Choose an image"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file);
            event.target.value = "";
          }}
        />

        {!previewUrl ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/60 px-6 py-12 text-ink-500 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <CameraIcon className="h-7 w-7 text-brand-600" />
            <span className="text-sm font-medium text-ink-700">Choose an image</span>
            <span className="text-xs text-ink-400">or drop a file from your device</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-ink-200 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {/* Blob/local preview: unoptimized to avoid loader config. */}
                <Image src={previewUrl} alt={fileName ?? "Selected image"} fill unoptimized className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">{fileName}</p>
                <p className="text-xs text-ink-400">Ready to search</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clear();
                  inputRef.current?.click();
                }}
                aria-label="Remove image"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => void search()}
                disabled={status === "searching"}
              >
                {status === "searching" ? (
                  <>
                    <SpinnerIcon className="h-4 w-4" /> Searching…
                  </>
                ) : (
                  "Search with this image"
                )}
              </Button>
              <Button variant="outline" onClick={clear} disabled={status === "searching"}>
                Remove
              </Button>
            </div>
          </div>
        )}

        {status === "error" && error ? (
          <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="flex gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-600">
            <SearchIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <p>No visually similar products found. Try a different image or check back later.</p>
          </div>
        ) : null}

        {status === "success" && results.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-700">Matching products</p>
              <Badge tone="brand">{results.length}</Badge>
            </div>
            <ul className="max-h-60 space-y-2 overflow-y-auto">
              {results.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border border-ink-100 p-2"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded bg-ink-100">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm text-ink-700">{product.name}</span>
                    {typeof product.similarity === "number" ? (
                      <span className="text-xs text-ink-400">
                        {Math.round(product.similarity * 100)}% match
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
