"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, CameraIcon, MicIcon, BarcodeIcon, SpinnerIcon } from "@/components/ui/icons";
import { useLocale } from "@/context/LocaleContext";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { POPULAR_SEARCHES } from "@/lib/api/search";
import { cn } from "@/lib/cn";
import { ImageSearchDialog } from "./ImageSearchDialog";
import { VoiceSearchDialog } from "./VoiceSearchDialog";
import { BarcodeSearchDialog } from "./BarcodeSearchDialog";
import { SmartSearchSuggestions } from "./SmartSearchSuggestions";

type Variant = "md" | "lg";

const ACTION_LABELS = {
  image: "Search by image",
  voice: "Search by voice",
  barcode: "Search by barcode",
} as const;

/**
 * The platform's main search experience: debounced autocomplete plus image,
 * voice and barcode entry points. Submitting navigates to the listing page with
 * the `search` query param, which is the single source of truth for results.
 */
export function SearchBar({
  variant = "md",
  className,
  autoFocus = false,
  initialValue = "",
  onSubmitted,
}: {
  variant?: Variant;
  className?: string;
  autoFocus?: boolean;
  initialValue?: string;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const { t, language } = useLocale();
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "image" | "voice" | "barcode">(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, loading } = useSearchSuggestions(value, { enabled: open });
  const { recent, add, clear } = useRecentSearches();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const submit = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    add(cleaned);
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/product?search=${encodeURIComponent(cleaned)}`);
    onSubmitted?.();
  };

  const pick = (term: string) => {
    setValue(term);
    submit(term);
  };

  const height = variant === "lg" ? "h-12 sm:h-14" : "h-11";
  const text = variant === "lg" ? "text-base" : "text-sm";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        className={cn(
          "flex items-center gap-1 rounded-xl border border-ink-200 bg-white pl-3 pr-1.5 shadow-sm transition-colors focus-within:border-brand-400",
          height,
        )}
      >
        <SearchIcon className="h-5 w-5 shrink-0 text-ink-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={t("search_placeholder")}
          aria-label={t("search")}
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink-800 outline-none placeholder:text-ink-400",
            text,
          )}
        />

        {/* Action buttons: icon-only on small screens, labelled on desktop. */}
        <div className="flex items-center gap-0.5">
          <IconAction label={ACTION_LABELS.image} onClick={() => setDialog("image")}>
            <CameraIcon className="h-5 w-5" />
          </IconAction>
          <IconAction label={ACTION_LABELS.voice} onClick={() => setDialog("voice")}>
            <MicIcon className="h-5 w-5" />
          </IconAction>
          <IconAction label={ACTION_LABELS.barcode} onClick={() => setDialog("barcode")}>
            <BarcodeIcon className="h-5 w-5" />
          </IconAction>
        </div>

        <button
          type="submit"
          aria-label={t("search")}
          className="focus-ring flex h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 sm:px-4"
        >
          {loading ? <SpinnerIcon className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
          <span className="hidden sm:inline">{t("search")}</span>
        </button>
      </form>

      {open ? (
        <div
          id="search-suggestions"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg"
        >
          <SmartSearchSuggestions
            query={value}
            loading={loading}
            suggestions={suggestions}
            recent={recent}
            popular={POPULAR_SEARCHES}
            onPick={pick}
            onClearRecent={clear}
          />
        </div>
      ) : null}

      <ImageSearchDialog open={dialog === "image"} onClose={() => setDialog(null)} />
      <VoiceSearchDialog
        open={dialog === "voice"}
        onClose={() => setDialog(null)}
        language={language}
        onTranscript={(transcript) => {
          setValue(transcript);
          submit(transcript);
        }}
      />
      <BarcodeSearchDialog
        open={dialog === "barcode"}
        onClose={() => setDialog(null)}
        onCode={(code) => {
          setValue(code);
          submit(code);
        }}
      />
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700"
    >
      {children}
    </button>
  );
}
