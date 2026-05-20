"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

interface AuthIconWrapProps {
  Icon: LucideIcon;
  /** When true, paints the circle in a danger tone (used for invalid state). */
  invalid?: boolean;
}

function IconCircle({ Icon, invalid }: AuthIconWrapProps) {
  return (
    <span
      className={clsx(
        "pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-900 transition sm:h-10 sm:w-10",
        invalid ? "bg-danger/15 text-danger" : "bg-bg-base text-accent-primary",
      )}
    >
      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
    </span>
  );
}

/** Generic auth input rendered as a pill with a circle-icon prefix. */
export interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon: LucideIcon;
  invalid?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { icon, invalid, className, ...rest },
  ref,
) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border bg-bg-base/[0.08] pl-1 pr-4 transition focus-within:bg-bg-base/[0.12] sm:gap-3 sm:pr-5",
        invalid
          ? "border-danger/60 focus-within:border-danger"
          : "border-bg-base/15 focus-within:border-accent-gold",
      )}
    >
      <IconCircle Icon={icon} invalid={invalid} />
      <input
        ref={ref}
        aria-invalid={invalid ? "true" : undefined}
        className={clsx(
          "h-11 w-full bg-transparent text-sm text-bg-base placeholder:text-bg-base/45 focus:outline-none autofill-on-dark sm:h-12 sm:text-base",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

/** Password input variant: circle icon on the left, circle eye-toggle on the right. */
export interface AuthPasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  icon: LucideIcon;
  invalid?: boolean;
}

export const AuthPasswordInput = forwardRef<HTMLInputElement, AuthPasswordInputProps>(
  function AuthPasswordInput({ icon, invalid, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div
        className={clsx(
          "flex items-center gap-2 rounded-full border bg-bg-base/[0.08] pl-1 pr-1 transition focus-within:bg-bg-base/[0.12] sm:gap-3",
          invalid
            ? "border-danger/60 focus-within:border-danger"
            : "border-bg-base/15 focus-within:border-accent-gold",
        )}
      >
        <IconCircle Icon={icon} invalid={invalid} />
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={invalid ? "true" : undefined}
          className={clsx(
            "h-11 w-full bg-transparent pr-1 text-sm text-bg-base placeholder:text-bg-base/45 focus:outline-none autofill-on-dark sm:h-12 sm:text-base",
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bg-base/10 text-bg-base/80 transition hover:bg-bg-base/20 hover:text-bg-base sm:h-10 sm:w-10"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

/** Pill-shaped, cream-on-ink primary CTA for auth forms. */
export interface AuthSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending?: boolean;
  pendingLabel?: string;
  children: React.ReactNode;
}

export function AuthSubmitButton({
  pending,
  pendingLabel,
  children,
  disabled,
  className,
  ...rest
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={clsx(
        "group relative inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-bg-base px-6 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-sm",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 bg-accent-gold transition-all group-hover:w-2"
      />
      {pending ? (pendingLabel ?? "Please wait…") : children}
    </button>
  );
}

/** Field label + error/hint stack tuned for the dark auth card. */
export interface AuthFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function AuthField({ label, htmlFor, required, error, hint, children }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="ml-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-bg-base/70 sm:text-[11px]"
        >
          {label}
          {required && <span className="ml-0.5 text-accent-gold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="ml-3 text-[11px] text-danger sm:text-xs" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="ml-3 text-[11px] text-bg-base/55 sm:text-xs">{hint}</span>
      ) : null}
    </div>
  );
}

/** Inline divider used between primary and provider sign-in options. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-bg-base/45 sm:my-5 sm:text-xs">
      <span className="h-px flex-1 bg-bg-base/15" />
      {label}
      <span className="h-px flex-1 bg-bg-base/15" />
    </div>
  );
}
