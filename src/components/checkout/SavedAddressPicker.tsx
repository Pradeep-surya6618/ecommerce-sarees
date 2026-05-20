"use client";

import { Check, MapPin, Phone, Plus, Sparkles } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { SavedAddress } from "@/types/domain";

export interface SavedAddressPickerProps {
  addresses: SavedAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export function SavedAddressPicker({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: SavedAddressPickerProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {addresses.map((a) => {
          const active = a.id === selectedId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              aria-pressed={active}
              className={clsx(
                "group relative flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-2xl border bg-bg-elevated p-3.5 text-left transition sm:gap-3 sm:p-4",
                active
                  ? "border-accent-primary shadow-sm"
                  : "border-ink-500/10 hover:border-accent-primary/40",
              )}
            >
              {/* Selected check — top-right */}
              <span
                aria-hidden
                className={clsx(
                  "absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full transition sm:h-6 sm:w-6",
                  active
                    ? "bg-accent-primary text-white"
                    : "border border-ink-500/30 bg-bg-elevated text-transparent group-hover:border-accent-primary/50",
                )}
              >
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </span>

              <div className="flex min-w-0 items-center gap-3 pr-7 sm:pr-8">
                <span
                  className={clsx(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                    a.isDefault
                      ? "bg-accent-gold/15 text-accent-gold"
                      : "bg-accent-primary/10 text-accent-primary",
                  )}
                >
                  <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                    {a.isDefault ? "Default" : "Saved"}
                  </span>
                  <span className="truncate font-display text-sm leading-tight text-ink-900 sm:text-base">
                    {a.label ?? "Address"}
                  </span>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-0.5 border-t border-ink-500/10 pt-2.5 text-[11px] leading-relaxed text-ink-700 sm:gap-1 sm:pt-3 sm:text-xs">
                <span className="truncate font-medium text-ink-900">{a.fullName}</span>
                <span className="truncate">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </span>
                <span className="truncate">
                  {a.city}, {a.state} {a.pincode}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-ink-500">
                  <Phone className="h-3 w-3 shrink-0" aria-hidden />
                  {a.phone}
                </span>
              </div>
            </button>
          );
        })}

        {/* Add new tile */}
        <button
          type="button"
          onClick={onAddNew}
          className="group flex min-h-[148px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-500/30 bg-bg-elevated p-4 transition hover:border-accent-primary hover:bg-bg-base/40"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary transition group-hover:bg-accent-primary group-hover:text-white sm:h-11 sm:w-11">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="font-display text-sm text-ink-900 sm:text-base">Add a new address</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accent-gold sm:text-[11px]">
            <Sparkles className="h-3 w-3" />
            One-time or save it
          </span>
        </button>
      </div>
    </div>
  );
}
