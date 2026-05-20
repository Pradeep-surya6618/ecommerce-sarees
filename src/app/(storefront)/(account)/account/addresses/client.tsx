"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Plus, Sparkles, X } from "lucide-react";
import { AddressCard } from "@/components/account/AddressCard";
import { SavedAddressForm } from "@/components/account/SavedAddressForm";
import type { SavedAddress } from "@/types/domain";

export function AddressesPageClient({ addresses }: { addresses: SavedAddress[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const editing = addresses.find((a) => a.id === editId) ?? null;
  const hasAddresses = addresses.length > 0;
  // Form is shown when: no addresses yet (onboarding state), the user clicked
  // "Add address", or the user clicked "Edit" on a card.
  const showForm = !hasAddresses || adding || !!editing;

  // When the form opens via user action (add or edit), scroll it into view.
  useEffect(() => {
    if (!showForm) return;
    if (!adding && !editing) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showForm, adding, editing]);

  function handleComplete() {
    setEditId(null);
    setAdding(false);
  }

  function startAdding() {
    setEditId(null);
    setAdding(true);
  }

  function cancel() {
    handleComplete();
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8 md:gap-10">
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          <Sparkles className="h-3 w-3" />
          Your space
        </span>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
            Addresses
          </h1>
          {hasAddresses && !showForm && (
            <button
              type="button"
              onClick={startAdding}
              className="group relative inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-full bg-accent-primary px-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-accent-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.2em] md:h-11 md:px-5 md:text-xs"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1 bg-accent-gold transition-all group-hover:w-1.5 sm:w-1.5 sm:group-hover:w-2"
              />
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add address</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-700 sm:text-sm">Manage where your sarees should ship.</p>
      </header>

      {/* ── Existing addresses ── */}
      {hasAddresses && (
        <section className="flex flex-col gap-3 sm:gap-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500 sm:text-xs">
            Saved
          </h2>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {addresses.map((a) => (
              <AddressCard key={a.id} address={a} onEdit={setEditId} />
            ))}
          </div>
        </section>
      )}

      {/* ── Form card ── */}
      {showForm && (
        <section
          ref={formRef}
          className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />
          <header className="mb-5 flex items-start justify-between gap-3 sm:mb-7">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
                {editing ? (
                  <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                ) : (
                  <Plus className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                )}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                  {editing ? "Editing" : "New entry"}
                </span>
                <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl md:text-2xl">
                  {editing ? "Edit address" : "Add a new address"}
                </h2>
              </div>
            </div>
            {/* Close — only meaningful when at least one address already exists. */}
            {hasAddresses && (
              <button
                type="button"
                onClick={cancel}
                aria-label="Close form"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-900/[0.06] hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </header>

          <SavedAddressForm
            editId={editing?.id}
            defaultValues={editing ?? undefined}
            onComplete={handleComplete}
          />
        </section>
      )}
    </div>
  );
}
