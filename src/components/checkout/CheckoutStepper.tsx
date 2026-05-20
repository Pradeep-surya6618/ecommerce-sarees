import { Check } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export type CheckoutStepId = "address" | "shipping" | "payment";

export interface CheckoutStepperProps {
  current: CheckoutStepId;
  completed: CheckoutStepId[];
}

const STEPS: { id: CheckoutStepId; label: string; index: number }[] = [
  { id: "address", label: "Address", index: 1 },
  { id: "shipping", label: "Shipping", index: 2 },
  { id: "payment", label: "Payment", index: 3 },
];

export function CheckoutStepper({ current, completed }: CheckoutStepperProps) {
  return (
    <ol className="flex w-full items-center gap-2 sm:gap-3">
      {STEPS.map((step, idx) => {
        const isCurrent = step.id === current;
        const isDone = completed.includes(step.id) && !isCurrent;
        const isLast = idx === STEPS.length - 1;
        return (
          <li
            key={step.id}
            className={clsx("flex shrink-0 items-center gap-2 sm:gap-3", !isLast && "flex-1")}
          >
            {/* Step badge */}
            <div
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition sm:h-8 sm:w-8 sm:text-xs",
                isDone
                  ? "border-accent-primary bg-accent-primary text-white shadow-sm"
                  : isCurrent
                    ? "border-ink-900 bg-ink-900 text-bg-base"
                    : "border-ink-500/30 bg-bg-elevated text-ink-500",
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : step.index}
            </div>

            {/* Label — visible on current step on mobile, all steps on desktop */}
            <span
              className={clsx(
                "whitespace-nowrap text-[10px] uppercase tracking-[0.2em] transition sm:text-xs",
                isCurrent ? "text-ink-900" : isDone ? "text-ink-700" : "text-ink-500",
                // Hide non-current labels on mobile to save room
                !isCurrent && "hidden sm:inline",
              )}
            >
              {step.label}
            </span>

            {/* Connector */}
            {!isLast && (
              <span
                aria-hidden
                className={clsx(
                  "h-px flex-1 transition",
                  isDone ? "bg-accent-primary" : "bg-ink-500/20",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
