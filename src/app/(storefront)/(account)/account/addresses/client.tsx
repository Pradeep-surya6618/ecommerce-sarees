"use client";

import { useState } from "react";
import { AddressCard } from "@/components/account/AddressCard";
import { SavedAddressForm } from "@/components/account/SavedAddressForm";
import type { SavedAddress } from "@/types/domain";

export function AddressesPageClient({ addresses }: { addresses: SavedAddress[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const editing = addresses.find((a) => a.id === editId) ?? null;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Addresses</h1>
        <p className="text-sm text-ink-700">Manage where your sarees should ship.</p>
      </header>

      <section>
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard key={a.id} address={a} onEdit={setEditId} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">
          {editing ? "Edit address" : "Add a new address"}
        </h2>
        <SavedAddressForm
          editId={editing?.id}
          defaultValues={editing ?? undefined}
          onComplete={() => setEditId(null)}
        />
      </section>
    </div>
  );
}
