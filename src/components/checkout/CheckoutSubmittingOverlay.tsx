"use client";

import { Loader2 } from "lucide-react";

export type SubmittingPhase = "placing" | "verifying";

interface Props {
  phase: SubmittingPhase | null;
}

const COPY: Record<SubmittingPhase, { title: string; subtitle: string }> = {
  placing: {
    title: "Placing your order",
    subtitle: "Hold on while we secure your saree…",
  },
  verifying: {
    title: "Confirming your payment",
    subtitle: "Verifying with the bank — don't refresh or close this tab.",
  },
};

// Full-page dark veil that sits over checkout while the server resolves a
// place-order or signature-verify call, OR while the browser navigates to the
// success/error page. Razorpay's own modal has a backdrop, so we show this
// AFTER the modal closes — that's the gap where the user would otherwise see
// the bare checkout flash before the redirect lands.
export function CheckoutSubmittingOverlay({ phase }: Props) {
  if (!phase) return null;
  const { title, subtitle } = COPY[phase];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/85 px-6 backdrop-blur-md"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl bg-bg-elevated px-7 py-9 text-center shadow-elev sm:px-10 sm:py-11">
        {/* Brass hairline echoing the rest of the checkout */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/70 to-transparent"
        />

        <span className="relative inline-flex h-16 w-16 items-center justify-center">
          <span aria-hidden className="absolute inset-0 rounded-full bg-accent-primary/15" />
          <span aria-hidden className="absolute inset-2 rounded-full bg-accent-primary/25" />
          <Loader2 className="relative h-7 w-7 animate-spin text-accent-primary" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-xl leading-tight text-ink-900 sm:text-2xl">{title}</h2>
          <p className="text-xs leading-relaxed text-ink-700 sm:text-sm">{subtitle}</p>
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold">
          Saree Store
        </span>
      </div>
    </div>
  );
}
