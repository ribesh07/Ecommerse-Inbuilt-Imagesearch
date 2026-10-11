"use client";

import { CloseIcon, SparkleIcon } from "@/components/ui/icons";
import { useHydrated } from "@/hooks/useHydrated";
import {
  createPersistentStore,
  parseBoolean,
  usePersistentStore,
} from "@/lib/persistent-store";

const MESSAGE =
  "Free delivery on eligible orders · Multi-vendor marketplace · Shop in your local currency";

const dismissedStore = createPersistentStore<boolean>(
  "sukilo.announcement.dismissed",
  false,
  parseBoolean,
);

/** Dismissible announcement bar. Persists dismissal client-side. */
export function AnnouncementBar() {
  const hydrated = useHydrated();
  const dismissed = usePersistentStore(dismissedStore);

  // Avoid a hydration mismatch: only render after the client has hydrated.
  if (!hydrated || dismissed) return null;

  return (
    <div className="bg-ink-900 text-white">
      <div className="container-page relative flex h-9 items-center justify-center gap-2 text-xs">
        <SparkleIcon className="hidden h-3.5 w-3.5 text-brand-300 sm:block" />
        <p className="truncate">{MESSAGE}</p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => dismissedStore.set(true)}
          className="focus-ring absolute right-4 flex h-6 w-6 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
