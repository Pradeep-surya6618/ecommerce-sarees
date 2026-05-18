"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { blockCustomerAction, unblockCustomerAction } from "@/server/actions/admin-customers";

export function CustomerBlockButton({ userId, blocked }: { userId: string; blocked: boolean }) {
  const [pending, startTransition] = useTransition();
  function toggle() {
    startTransition(async () => {
      try {
        if (blocked) {
          await unblockCustomerAction(userId);
          toast.success("Customer unblocked");
        } else {
          await blockCustomerAction(userId);
          toast.success("Customer blocked");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-sm px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
        blocked
          ? "bg-success text-white hover:bg-success/90"
          : "border border-danger text-danger hover:bg-danger hover:text-white"
      }`}
    >
      {pending ? "Working…" : blocked ? "Unblock" : "Block"}
    </button>
  );
}
