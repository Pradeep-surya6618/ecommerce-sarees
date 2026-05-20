import { Check, CircleDot, PackageCheck, Sparkles, Truck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { OrderStatus } from "@/types/domain";

interface Step {
  status: OrderStatus;
  label: string;
  description: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  {
    status: "confirmed",
    label: "Confirmed",
    description: "We've received your order.",
    icon: Sparkles,
  },
  {
    status: "paid",
    label: "Paid",
    description: "Payment confirmed.",
    icon: Wallet,
  },
  {
    status: "shipped",
    label: "Shipped",
    description: "On its way to you.",
    icon: Truck,
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Saree is at your door.",
    icon: PackageCheck,
  },
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
  // Active step is the next one after the last done step (visually highlighted
  // with a pulsing gold ring). When delivered, no active step.
  const activeIdx = STEPS.findIndex((s) => RANK[s.status] === current);

  return (
    <ol className="relative flex flex-col gap-5 sm:gap-6">
      {STEPS.map((step, idx) => {
        const idxRank = RANK[step.status];
        const done = current > idxRank;
        const isActive = idx === activeIdx;
        const Icon = step.icon;
        const isLast = idx === STEPS.length - 1;

        return (
          <li key={step.status} className="relative flex items-start gap-3 sm:gap-4">
            {/* Vertical connector — sits behind the dot, fills to the next step */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[15px] top-7 h-[calc(100%+1.25rem)] w-px bg-ink-500/20 sm:left-[19px] sm:top-9 sm:h-[calc(100%+1.5rem)]"
              />
            )}
            {!isLast && done && (
              <span
                aria-hidden
                className="order-progress-fill absolute left-[15px] top-7 h-[calc(100%+1.25rem)] w-px bg-success sm:left-[19px] sm:top-9 sm:h-[calc(100%+1.5rem)]"
              />
            )}

            {/* Status dot */}
            <span
              className={clsx(
                "relative z-10 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 transition sm:h-[38px] sm:w-[38px]",
                done
                  ? "border-success bg-success text-white"
                  : isActive
                    ? "order-step-pulse border-success bg-bg-elevated text-success"
                    : "border-ink-500/30 bg-bg-elevated text-ink-500",
              )}
            >
              {done ? (
                <span key={`done-${step.status}`} className="order-step-pop inline-flex">
                  <Check className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
                </span>
              ) : isActive ? (
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <CircleDot className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
            </span>

            {/* Label + description */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5 sm:pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={clsx(
                    "font-display text-sm leading-tight sm:text-base",
                    done ? "text-ink-900" : isActive ? "text-ink-900" : "text-ink-500",
                  )}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-success sm:text-[10px]">
                    In progress
                  </span>
                )}
              </div>
              <p
                className={clsx(
                  "text-[11px] leading-relaxed sm:text-xs",
                  done || isActive ? "text-ink-700" : "text-ink-500/80",
                )}
              >
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
