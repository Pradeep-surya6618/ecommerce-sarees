"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil, Phone, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddressAction, setDefaultAddressAction } from "@/server/actions/addresses";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SavedAddress } from "@/types/domain";

export function AddressCard({
  address,
  onEdit,
}: {
  address: SavedAddress;
  onEdit: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function setDefault() {
    startTransition(async () => {
      try {
        await setDefaultAddressAction(address.id);
        toast.success("Default address updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteAddressAction(address.id);
        toast.success("Address deleted successfully", {
          description: `"${address.label ?? address.fullName}" has been removed.`,
        });
        // If the parent revalidates and unmounts us first, this is a no-op.
        setConfirmOpen(false);
      } catch (err) {
        setConfirmOpen(false);
        toast.error("Couldn't delete the address", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
    });
  }

  return (
    <article className="group relative flex min-w-0 flex-col gap-3 rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 transition hover:border-accent-primary/30 hover:shadow-sm sm:gap-4 sm:p-5">
      {/* Top brass hairline reveals on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      {/* ── Header ── */}
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10 ${
              address.isDefault
                ? "bg-accent-gold/15 text-accent-gold"
                : "bg-accent-primary/10 text-accent-primary"
            }`}
          >
            <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
              {address.isDefault ? "Default" : "Address"}
            </span>
            <h3 className="truncate font-display text-base leading-tight text-ink-900 sm:text-lg">
              {address.label ?? "Saved address"}
            </h3>
          </div>
        </div>

        {/* Quick actions (icon-only) */}
        <div className="flex shrink-0 items-center gap-1">
          {!address.isDefault && (
            <div className="group/star relative">
              <button
                type="button"
                onClick={setDefault}
                disabled={pending}
                aria-label="Set as default"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-accent-gold/10 hover:text-accent-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
              <span
                aria-hidden
                className="nav-tooltip pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-accent-primary-hover px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white opacity-0 shadow-md transition-opacity delay-100 duration-150 group-hover/star:opacity-100"
              >
                Set as default
              </span>
            </div>
          )}
          <div className="group/trash relative">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
              aria-label="Delete address"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-500 transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <span
              aria-hidden
              className="nav-tooltip pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-[#7a1812] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white opacity-0 shadow-md transition-opacity delay-100 duration-150 group-hover/trash:opacity-100"
            >
              Delete
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-w-0 flex-col gap-1 border-t border-ink-500/10 pt-3 sm:pt-4">
        <p className="truncate text-sm font-semibold text-ink-900 sm:text-[15px]">
          {address.fullName}
        </p>
        <p className="text-xs leading-relaxed text-ink-700 sm:text-sm">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
        </p>
        <p className="text-xs leading-relaxed text-ink-700 sm:text-sm">
          {address.city}, {address.state} {address.pincode}
        </p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink-500 sm:text-xs">
          <Phone className="h-3 w-3 shrink-0" aria-hidden />
          {address.phone}
        </p>
      </div>

      {/* ── Edit pill ── */}
      <div>
        <button
          type="button"
          onClick={() => onEdit(address.id)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700 transition hover:border-accent-primary hover:text-accent-primary sm:text-[11px]"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this address?"
        description={`"${address.label ?? address.fullName}" will be removed from your saved addresses. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={pending}
      />
    </article>
  );
}
