"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

// ─── Section header for grouping fields ──────────────────────────────────────

export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[11px]">
          {title}
        </h3>
        {hint && <p className="text-[11px] text-ink-500 sm:text-xs">{hint}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:gap-4">{children}</div>
    </section>
  );
}

// ─── Field label / hint / error stack ────────────────────────────────────────

export interface PillFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function PillField({ label, htmlFor, required, error, hint, children }: PillFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="ml-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-700 sm:text-[11px]"
      >
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <span className="ml-3 text-[11px] text-danger sm:text-xs" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="ml-3 text-[11px] text-ink-500 sm:text-xs">{hint}</span>
      ) : null}
    </div>
  );
}

// ─── Icon prefix circle (shared) ─────────────────────────────────────────────

function IconCircle({
  icon: Icon,
  invalid,
  muted,
}: {
  icon: LucideIcon;
  invalid?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={clsx(
        "pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
        invalid
          ? "bg-danger/15 text-danger"
          : muted
            ? "bg-ink-500/10 text-ink-500"
            : "bg-ink-900/[0.06] text-accent-primary",
      )}
    >
      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
    </span>
  );
}

// ─── Pill text input ─────────────────────────────────────────────────────────

export interface PillInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon: LucideIcon;
  invalid?: boolean;
}

export const PillInput = forwardRef<HTMLInputElement, PillInputProps>(function PillInput(
  { icon, invalid, disabled, className, ...rest },
  ref,
) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border bg-bg-elevated pl-1 pr-4 transition sm:gap-3 sm:pr-5",
        disabled && "opacity-60",
        invalid
          ? "border-danger/60 focus-within:border-danger"
          : "border-ink-500/20 focus-within:border-accent-primary",
      )}
    >
      <IconCircle icon={icon} invalid={invalid} muted={disabled} />
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid ? "true" : undefined}
        className={clsx(
          "autofill-on-light h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none disabled:cursor-not-allowed sm:h-12 sm:text-base",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

// ─── Pill password input with eye toggle ─────────────────────────────────────

export interface PillPasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  icon: LucideIcon;
  invalid?: boolean;
}

export const PillPasswordInput = forwardRef<HTMLInputElement, PillPasswordInputProps>(
  function PillPasswordInput({ icon, invalid, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div
        className={clsx(
          "flex items-center gap-2 rounded-full border bg-bg-elevated pl-1 pr-1 transition sm:gap-3",
          invalid
            ? "border-danger/60 focus-within:border-danger"
            : "border-ink-500/20 focus-within:border-accent-primary",
        )}
      >
        <IconCircle icon={icon} invalid={invalid} />
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={invalid ? "true" : undefined}
          className={clsx(
            "autofill-on-light h-11 w-full bg-transparent pr-1 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:h-12 sm:text-base",
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink-900/[0.04] text-ink-500 transition hover:bg-ink-900/[0.08] hover:text-ink-900 sm:h-10 sm:w-10"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

// ─── Submit button: pill, accent-primary, gold accent stripe ─────────────────

export interface PillSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  pendingLabel?: string;
  children: React.ReactNode;
}

export function PillSubmitButton({
  pending,
  pendingLabel,
  children,
  disabled,
  className,
  ...rest
}: PillSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={clsx(
        "group relative inline-flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-accent-primary px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-6 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-accent-gold transition-all group-hover:w-1.5 sm:w-1.5 sm:group-hover:w-2"
      />
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
