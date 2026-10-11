"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Barcode scanning via the device camera using @zxing/browser (a maintained,
 * framework-agnostic port of the ZXing library). The library is imported
 * dynamically so it never enters the initial bundle.
 *
 * The scanned code is surfaced to the caller, which then calls the
 * `searchByBarcode` service abstraction.
 */

export type ScannerStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "unsupported"
  | "denied"
  | "error";

export interface UseBarcodeScannerResult {
  supported: boolean;
  status: ScannerStatus;
  error: string | null;
  /** Attach this ref to the <video> element that should show the camera feed. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => void;
  stop: () => void;
}

export interface UseBarcodeScannerOptions {
  onDetected?: (code: string) => void;
}

export function useBarcodeScanner(
  options: UseBarcodeScannerOptions = {},
): UseBarcodeScannerResult {
  const { onDetected } = options;
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // ZXing's controls object; typed loosely because it is loaded dynamically.
  const controlsRef = useRef<{ stop?: () => void } | null>(null);
  const detectedRef = useRef(onDetected);

  useEffect(() => {
    detectedRef.current = onDetected;
  }, [onDetected]);

  const supported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const stop = useCallback(() => {
    try {
      controlsRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    // Ensure any lingering camera tracks are released.
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (!supported) {
      setStatus("unsupported");
      setError("Camera/barcode scanning is not supported on this device.");
      return;
    }
    if (!videoRef.current) {
      setStatus("error");
      setError("Scanner view is not ready yet.");
      return;
    }

    setError(null);
    setStatus("starting");

    try {
      const [browser, library] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      const reader = new browser.BrowserMultiFormatReader(
        library.DecodeHintType
          ? new Map([[library.DecodeHintType.TRY_HARDER, true]])
          : undefined,
      );

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            const code = result.getText();
            detectedRef.current?.(code);
            // Stop after the first successful detection.
            stop();
          }
        },
      );
      controlsRef.current = controls;
      setStatus("scanning");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
        setError("Camera permission denied. Allow camera access and try again.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setStatus("error");
        setError("No usable camera was found on this device.");
      } else {
        setStatus("error");
        setError("Unable to start the barcode scanner. You can enter the code manually.");
      }
    }
  }, [supported, stop]);

  useEffect(() => stop, [stop]);

  return { supported, status, error, videoRef, start, stop };
}
