"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MicIcon, SpinnerIcon, AlertIcon } from "@/components/ui/icons";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { cn } from "@/lib/cn";

/**
 * Voice search dialog. Uses the Web Speech API (client-side STT). The final
 * transcript is passed back to the search bar, which runs a normal product
 * search. Unsupported browsers and denied permissions are handled explicitly.
 */
export function VoiceSearchDialog({
  open,
  onClose,
  language,
  onTranscript,
}: {
  open: boolean;
  onClose: () => void;
  language: string;
  onTranscript: (transcript: string) => void;
}) {
  const { supported, status, transcript, error, start, stop, reset } = useVoiceSearch({
    language,
    onResult: (text) => {
      onTranscript(text);
      window.setTimeout(onClose, 350);
    },
  });

  const listening = status === "listening";

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Voice search"
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        {!supported ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
              <MicIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium text-ink-800">Voice search unavailable</p>
              <p className="mt-1 text-sm text-ink-500">
                Your browser doesn&apos;t support speech recognition. Try Chrome, Edge or Safari, or
                type your search instead.
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={listening ? stop : start}
              aria-label={listening ? "Stop listening" : "Start voice search"}
              className={cn(
                "focus-ring relative flex h-20 w-20 items-center justify-center rounded-full text-white transition-colors",
                listening ? "bg-rose-600" : "bg-brand-600 hover:bg-brand-700",
              )}
            >
              {listening ? <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" /> : null}
              {status === "processing" ? (
                <SpinnerIcon className="h-7 w-7" />
              ) : (
                <MicIcon className="h-7 w-7" />
              )}
            </button>

            <p className="text-sm font-medium text-ink-700">
              {listening
                ? "Listening…"
                : status === "processing"
                  ? "Processing…"
                  : "Tap the microphone and speak"}
            </p>

            <p className="min-h-[1.5rem] text-sm text-ink-500" aria-live="polite">
              {transcript || "\u00A0"}
            </p>

            {error ? (
              <div className="flex w-full gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-sm text-rose-700">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <p className="text-xs text-ink-400">
              Try saying: “Show me running shoes” or “wireless headphones”.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
