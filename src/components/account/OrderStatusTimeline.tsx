import { Check, Circle } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { OrderStatus } from "@/types/domain";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "paid", label: "Paid" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

const RANK: Record<OrderStatus, number> = {
  pending_payment: 0,
  confirmed: 1,
  paid: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  payment_failed: -1,
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const current = RANK[status] ?? 0;
  return (
    <ol className="flex flex-col gap-4">
      {STEPS.map((step) => {
        const idx = RANK[step.status];
        const done = current >= idx;
        return (
          <li key={step.status} className="flex items-start gap-3">
            <span
              className={clsx(
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border",
                done
                  ? "border-success bg-success text-white"
                  : "border-ink-500/30 bg-bg-elevated text-ink-500",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" />}
            </span>
            <span className={clsx("text-sm", done ? "text-ink-900" : "text-ink-500")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
