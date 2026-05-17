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
    <ol className="flex items-center gap-3">
      {STEPS.map((step, idx) => {
        const isCurrent = step.id === current;
        const isDone = completed.includes(step.id) && !isCurrent;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <div
              className={clsx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                isDone
                  ? "border-accent-primary bg-accent-primary text-white"
                  : isCurrent
                    ? "border-ink-900 text-ink-900"
                    : "border-ink-500/30 text-ink-500",
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : step.index}
            </div>
            <span
              className={clsx(
                "text-xs uppercase tracking-wide",
                isCurrent ? "text-ink-900" : "text-ink-500",
              )}
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <span className="hidden flex-1 border-t border-ink-500/20 md:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
