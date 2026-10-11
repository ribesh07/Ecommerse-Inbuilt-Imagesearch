"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BarcodeIcon, AlertIcon } from "@/components/ui/icons";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

/**
 * Barcode search dialog. When the device exposes a camera we run a live ZXing
 * scanner; otherwise the user can always type the barcode. The resolved code is
 * handed to `searchByBarcode` by the caller.
 */
export function BarcodeSearchDialog({
  open,
  onClose,
  onCode,
}: {
  open: boolean;
  onClose: () => void;
  onCode: (code: string) => void;
}) {
  const [manual, setManual] = useState("");
  const { supported, status, error, videoRef, start, stop } = useBarcodeScanner({
    onDetected: (code) => {
      onCode(code);
      window.setTimeout(onClose, 200);
    },
  });

  const close = () => {
    stop();
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Search by barcode">
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-900">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            aria-label="Barcode scanner camera preview"
          />
          {status !== "scanning" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-900/80 text-center text-white">
              <BarcodeIcon className="h-8 w-8" />
              <p className="max-w-xs px-4 text-sm text-ink-200">
                {!supported
                  ? "This device can't use the camera scanner."
                  : "Point your camera at a product barcode to scan it."}
              </p>
              {supported ? (
                <Button size="sm" onClick={() => void start()} disabled={status === "starting"}>
                  {status === "starting" ? "Starting camera…" : "Start camera"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-4/5 rounded-lg border-2 border-white/80" />
            </div>
          )}
        </div>

        {error ? (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {/* Manual fallback is always available. */}
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const code = manual.trim();
            if (!code) return;
            onCode(code);
            window.setTimeout(close, 150);
          }}
        >
          <label htmlFor="manual-barcode" className="block text-sm font-medium text-ink-700">
            Enter barcode manually
          </label>
          <div className="flex gap-2">
            <input
              id="manual-barcode"
              value={manual}
              onChange={(event) => setManual(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 8901234567890"
              className="focus-ring h-10 flex-1 rounded-lg border border-ink-200 px-3 text-sm text-ink-800 outline-none placeholder:text-ink-400"
            />
            <Button type="submit" disabled={!manual.trim()}>
              Search
            </Button>
          </div>
          <p className="text-xs text-ink-400">
            {/* Honest note: barcode lookup depends on backend indexing. */}
            Barcodes are matched using the product search service.
          </p>
        </form>
      </div>
    </Modal>
  );
}
