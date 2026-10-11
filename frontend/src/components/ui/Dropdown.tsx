"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./icons";
import { cn } from "@/lib/cn";

/**
 * Lightweight accessible dropdown used by the country/currency/language
 * selectors. Closes on outside click and Escape.
 */
export function Dropdown({
  label,
  icon,
  children,
  align = "left",
  className,
  panelClassName,
  triggerClassName,
  ariaLabel,
}: {
  label: ReactNode;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "focus-ring flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900",
          triggerClassName,
        )}
      >
        {icon}
        <span className="max-w-[9rem] truncate">{label}</span>
        <ChevronDownIcon className={cn("h-4 w-4 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1 max-h-80 w-56 overflow-y-auto rounded-xl border border-ink-200 bg-white p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        selected ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-100",
      )}
    >
      {children}
    </button>
  );
}
