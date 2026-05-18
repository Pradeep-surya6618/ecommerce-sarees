"use client";

import { useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddressAction, setDefaultAddressAction } from "@/server/actions/addresses";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import type { SavedAddress } from "@/types/domain";

export function AddressCard({
  address,
  onEdit,
}: {
  address: SavedAddress;
  onEdit: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

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

  function remove() {
    startTransition(async () => {
      try {
        await deleteAddressAction(address.id);
        toast.success("Address removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <article className="flex flex-col gap-3 rounded-md border border-ink-500/10 bg-bg-elevated p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg text-ink-900">{address.label ?? "Address"}</h3>
          {address.isDefault && <Badge tone="gold">Default</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {!address.isDefault && (
            <IconButton aria-label="Set as default" onClick={setDefault} disabled={pending}>
              <Star className="h-4 w-4" />
            </IconButton>
          )}
          <IconButton aria-label="Delete" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </header>
      <div className="text-sm text-ink-700">
        <p className="font-medium text-ink-900">{address.fullName}</p>
        <p>
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
        </p>
        <p>
          {address.city}, {address.state} {address.pincode}
        </p>
        <p className="mt-1 text-xs text-ink-500">{address.phone}</p>
      </div>
      <button
        type="button"
        onClick={() => onEdit(address.id)}
        className="self-start text-xs uppercase tracking-wide text-ink-500 transition hover:text-ink-900"
      >
        Edit
      </button>
    </article>
  );
}
