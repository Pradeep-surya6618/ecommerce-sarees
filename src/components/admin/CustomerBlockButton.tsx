"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { blockCustomerAction, unblockCustomerAction } from "@/server/actions/admin-customers";

export function CustomerBlockButton({ userId, blocked }: { userId: string; blocked: boolean }) {
  const [pending, startTransition] = useTransition();
  function toggle() {
    startTransition(async () => {
      try {
        const result = blocked
          ? await unblockCustomerAction(userId)
          : await blockCustomerAction(userId);
        if (!result.ok) {
          toast.error("Couldn't update customer", { description: result.error });
          return;
        }
        toast.success(blocked ? "Customer unblocked" : "Customer blocked");
      } catch {
        toast.error("Couldn't update customer", { description: "Please try again." });
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
