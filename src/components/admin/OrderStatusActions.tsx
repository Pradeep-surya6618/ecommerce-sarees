"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { refundOrderAction, updateOrderStatusAction } from "@/server/actions/admin-orders";
import type { OrderStatus } from "@/types/domain";

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();

  function set(next: OrderStatus) {
    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(orderId, next);
        if (!result.ok) {
          toast.error("Couldn't update status", { description: result.error });
          return;
        }
        toast.success(`Marked as ${next}`);
      } catch {
        toast.error("Couldn't update status", { description: "Please try again." });
      }
    });
  }

  function refund() {
    startTransition(async () => {
      try {
        const result = await refundOrderAction(orderId);
        if (!result.ok) {
          toast.error("Couldn't cancel order", { description: result.error });
          return;
        }
        toast.success("Order cancelled");
      } catch {
        toast.error("Couldn't cancel order", { description: "Please try again." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending || status === "shipped"}
        onClick={() => set("shipped")}
        className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
      >
        Mark shipped
      </button>
      <button
        type="button"
        disabled={pending || status === "delivered"}
        onClick={() => set("delivered")}
        className="rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:opacity-50"
      >
        Mark delivered
      </button>
      <button
        type="button"
        disabled={pending || status === "cancelled"}
        onClick={refund}
        className="rounded-sm border border-danger px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
      >
        Cancel &amp; refund
      </button>
    </div>
  );
}
