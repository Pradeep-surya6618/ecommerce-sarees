"use client";

import { useState, useTransition } from "react";
import { Ban, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { blockCustomerAction, unblockCustomerAction } from "@/server/actions/admin-customers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Props {
  userId: string;
  blocked: boolean;
  customerName: string;
}

export function CustomerBlockButton({ userId, blocked, customerName }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function commit() {
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
        setOpen(false);
      } catch {
        toast.error("Couldn't update customer", { description: "Please try again." });
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
        <span
          className={clsx(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
            blocked ? "bg-success/12 text-success" : "bg-danger/10 text-danger",
          )}
        >
          {blocked ? (
            <ShieldCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          ) : (
            <ShieldOff className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
            Actions
          </span>
          <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl">
            {blocked ? "Customer access" : "Access control"}
          </h2>
        </div>
      </header>

      <p className="mb-3 text-xs leading-relaxed text-ink-700 sm:mb-4 sm:text-sm">
        {blocked
          ? "This customer is currently blocked from signing in or placing orders. Unblock to restore access."
          : "Blocking prevents this customer from signing in or placing new orders. Existing orders are unaffected."}
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={clsx(
          "group inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-sm",
          blocked
            ? "bg-success text-white shadow-[0_8px_22px_-14px_rgba(26,122,58,0.7)] hover:bg-success-hover"
            : "border border-danger/40 bg-bg-elevated text-danger hover:border-danger hover:bg-danger hover:text-white",
        )}
      >
        {blocked ? (
          <>
            <ShieldCheck className="h-3.5 w-3.5 transition group-hover:scale-110 sm:h-4 sm:w-4" />
            Unblock customer
          </>
        ) : (
          <>
            <Ban className="h-3.5 w-3.5 transition group-hover:scale-110 sm:h-4 sm:w-4" />
            Block customer
          </>
        )}
      </button>

      {blocked ? (
        <ConfirmDialog
          open={open}
          onClose={() => (pending ? undefined : setOpen(false))}
          onConfirm={commit}
          title={`Unblock ${customerName}?`}
          description="They'll be able to sign in and place new orders again. You can block them again at any time."
          tone="success"
          icon={ShieldCheck}
          confirmLabel="Yes, unblock"
          pending={pending}
          pendingLabel="Unblocking…"
        />
      ) : (
        <ConfirmDialog
          open={open}
          onClose={() => (pending ? undefined : setOpen(false))}
          onConfirm={commit}
          title={`Block ${customerName}?`}
          description="They'll be locked out of sign-in and checkout until you unblock them. Existing orders are unaffected."
          tone="danger"
          icon={Ban}
          confirmLabel="Yes, block"
          pending={pending}
          pendingLabel="Blocking…"
        />
      )}
    </section>
  );
}
