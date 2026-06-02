"use client";

import { useState, useTransition } from "react";
import { Ban, PackageCheck, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { refundOrderAction, updateOrderStatusAction } from "@/server/actions/admin-orders";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { OrderStatus } from "@/types/domain";

type DialogKind = "shipped" | "delivered" | "refund";

export function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  // Single state for which confirmation is open; mounting the dialogs always
  // keeps the exit animation playing on close, so we just toggle this between
  // null and the kind that was clicked.
  const [dialog, setDialog] = useState<DialogKind | null>(null);

  function set(next: OrderStatus) {
    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(orderId, next);
        if (!result.ok) {
          toast.error("Couldn't update status", { description: result.error });
          return;
        }
        toast.success(`Marked as ${next}`);
        setDialog(null);
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
        setDialog(null);
      } catch {
        toast.error("Couldn't cancel order", { description: "Please try again." });
      }
    });
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 shadow-card sm:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
      />
      <header className="mb-3 flex items-center gap-2.5 sm:gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
          <Zap className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
            Actions
          </span>
          <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
            Update status
          </h2>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:gap-2.5">
        <ActionButton
          icon={Truck}
          label="Mark shipped"
          tone="ink"
          disabled={pending || status === "shipped" || status === "delivered"}
          onClick={() => setDialog("shipped")}
        />
        <ActionButton
          icon={PackageCheck}
          label="Mark delivered"
          tone="primary"
          disabled={pending || status === "delivered"}
          onClick={() => setDialog("delivered")}
        />
        <ActionButton
          icon={Ban}
          label="Cancel & refund"
          tone="danger"
          disabled={pending || status === "cancelled" || status === "delivered"}
          onClick={() => setDialog("refund")}
        />
      </div>

      {/* ── Confirmation dialogs ── */}
      <ConfirmDialog
        open={dialog === "shipped"}
        onClose={() => (pending ? undefined : setDialog(null))}
        onConfirm={() => set("shipped")}
        title="Mark this order shipped?"
        description="The customer will see this status on their order page. You can still mark it delivered or cancel later."
        tone="info"
        icon={Truck}
        confirmLabel="Yes, mark shipped"
        pending={pending && dialog === "shipped"}
        pendingLabel="Shipping…"
      />
      <ConfirmDialog
        open={dialog === "delivered"}
        onClose={() => (pending ? undefined : setDialog(null))}
        onConfirm={() => set("delivered")}
        title="Mark this order delivered?"
        description="This will close the order journey on the customer's end. Only confirm once you've verified the parcel reached them."
        tone="success"
        icon={PackageCheck}
        confirmLabel="Yes, mark delivered"
        pending={pending && dialog === "delivered"}
        pendingLabel="Marking…"
      />
      <ConfirmDialog
        open={dialog === "refund"}
        onClose={() => (pending ? undefined : setDialog(null))}
        onConfirm={refund}
        title="Cancel and refund this order?"
        description="This cancels the order and flags it as refunded in our records. The customer should be notified separately if any payment was captured."
        tone="danger"
        icon={Ban}
        confirmLabel="Yes, cancel & refund"
        pending={pending && dialog === "refund"}
        pendingLabel="Refunding…"
      />
    </section>
  );
}

type Tone = "ink" | "primary" | "danger";

function ActionButton({
  icon: Icon,
  label,
  tone,
  disabled,
  onClick,
}: {
  icon: typeof Truck;
  label: string;
  tone: Tone;
  disabled: boolean;
  onClick: () => void;
}) {
  const toneClass: Record<Tone, string> = {
    ink: "bg-ink-900 text-white hover:bg-ink-700 shadow-[0_8px_22px_-14px_rgba(37,31,62,0.6)]",
    primary:
      "bg-accent-primary text-white hover:bg-accent-primary-hover shadow-[0_8px_22px_-14px_rgba(91,58,138,0.7)]",
    danger:
      "border border-danger/40 bg-bg-elevated text-danger hover:border-danger hover:bg-danger hover:text-white",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "group inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5 sm:text-sm",
        toneClass[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5 transition group-hover:scale-110 sm:h-4 sm:w-4" />
      {label}
    </button>
  );
}
