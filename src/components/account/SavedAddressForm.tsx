"use client";

import { forwardRef, useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Check,
  ChevronDown,
  Hash,
  Home,
  Mail,
  Map,
  MapPin,
  Phone,
  Search,
  Tag,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { INDIA_STATES } from "@/lib/cart/india-states";
import { clsx } from "@/lib/utils/clsx";
import { createAddressAction, updateAddressAction } from "@/server/actions/addresses";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile"),
  email: z.email("Enter a valid email"),
  line1: z.string().min(5, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  label: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export interface SavedAddressFormProps {
  editId?: string;
  defaultValues?: Partial<Values>;
  onComplete?: () => void;
}

export function SavedAddressForm({ editId, defaultValues, onComplete }: SavedAddressFormProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        if (editId) {
          await updateAddressAction(editId, values);
          toast.success("Address updated");
        } else {
          await createAddressAction({ ...values, country: "IN" });
          toast.success("Address added");
        }
        reset();
        onComplete?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save the address.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-7">
      {/* ── Contact section ── */}
      <Section title="Contact" hint="So we can reach you about your order.">
        <PillField
          label="Label"
          htmlFor="label"
          hint="A nickname for this address."
          error={errors.label?.message}
        >
          <PillInput
            id="label"
            icon={Tag}
            placeholder="Home, Office, etc."
            {...register("label")}
          />
        </PillField>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          <PillField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
            <PillInput
              id="fullName"
              icon={User}
              autoComplete="name"
              placeholder="Your name"
              {...register("fullName")}
              invalid={!!errors.fullName}
            />
          </PillField>
          <PillField label="Mobile" htmlFor="phone" required error={errors.phone?.message}>
            <PillInput
              id="phone"
              icon={Phone}
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              {...register("phone")}
              invalid={!!errors.phone}
            />
          </PillField>
        </div>
        <PillField label="Email" htmlFor="email" required error={errors.email?.message}>
          <PillInput
            id="email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            invalid={!!errors.email}
          />
        </PillField>
      </Section>

      {/* ── Address section ── */}
      <Section title="Where it ships" hint="Use the address on the package.">
        <PillField label="Address line 1" htmlFor="line1" required error={errors.line1?.message}>
          <PillInput
            id="line1"
            icon={Home}
            autoComplete="address-line1"
            placeholder="Street name and number"
            {...register("line1")}
            invalid={!!errors.line1}
          />
        </PillField>
        <PillField
          label="Apartment, suite"
          htmlFor="line2"
          hint="Optional."
          error={errors.line2?.message}
        >
          <PillInput
            id="line2"
            icon={Building2}
            autoComplete="address-line2"
            placeholder="Apt, suite, landmark"
            {...register("line2")}
          />
        </PillField>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          <PillField label="City" htmlFor="city" required error={errors.city?.message}>
            <PillInput
              id="city"
              icon={MapPin}
              autoComplete="address-level2"
              placeholder="Bengaluru"
              {...register("city")}
              invalid={!!errors.city}
            />
          </PillField>
          <PillField label="Pincode" htmlFor="pincode" required error={errors.pincode?.message}>
            <PillInput
              id="pincode"
              icon={Hash}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="560001"
              {...register("pincode")}
              invalid={!!errors.pincode}
            />
          </PillField>
        </div>
        <PillField label="State" htmlFor="state" required error={errors.state?.message}>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <PillListbox
                id="state"
                icon={Map}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={INDIA_STATES}
                placeholder="Select a state"
                invalid={!!errors.state}
              />
            )}
          />
        </PillField>
      </Section>

      {/* ── Submit ── */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {editId && (
          <button
            type="button"
            onClick={() => {
              reset();
              onComplete?.();
            }}
            className="cursor-pointer text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500 transition hover:text-ink-900 sm:text-xs sm:tracking-[0.2em] md:text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="group relative inline-flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-accent-primary px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-6 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-accent-gold transition-all group-hover:w-1.5 sm:w-1.5 sm:group-hover:w-2"
          />
          {pending ? "Saving…" : editId ? "Save changes" : "Add address"}
        </button>
      </div>
    </form>
  );
}

// ─── Local field primitives ──────────────────────────────────────────────────

function Section({
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

interface PillFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function PillField({ label, htmlFor, required, error, hint, children }: PillFieldProps) {
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

function IconCircle({ icon: Icon, invalid }: { icon: LucideIcon; invalid?: boolean }) {
  return (
    <span
      className={clsx(
        "pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
        invalid ? "bg-danger/15 text-danger" : "bg-ink-900/[0.06] text-accent-primary",
      )}
    >
      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
    </span>
  );
}

interface PillInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon: LucideIcon;
  invalid?: boolean;
}

const PillInput = forwardRef<HTMLInputElement, PillInputProps>(function PillInput(
  { icon, invalid, className, ...rest },
  ref,
) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border bg-bg-elevated pl-1 pr-4 transition sm:gap-3 sm:pr-5",
        invalid
          ? "border-danger/60 focus-within:border-danger"
          : "border-ink-500/20 focus-within:border-accent-primary",
      )}
    >
      <IconCircle icon={icon} invalid={invalid} />
      <input
        ref={ref}
        aria-invalid={invalid ? "true" : undefined}
        className={clsx(
          "autofill-on-light h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:h-12 sm:text-base",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

interface PillListboxProps {
  id?: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly string[];
  placeholder?: string;
  invalid?: boolean;
}

function PillListbox({
  id,
  icon,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select…",
  invalid,
}: PillListboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options by query (case-insensitive substring match).
  function filterFor(q: string): string[] {
    const t = q.trim().toLowerCase();
    return t === "" ? [...options] : options.filter((o) => o.toLowerCase().includes(t));
  }
  const filtered = filterFor(query);

  function openPanel() {
    const selectedIdx = options.findIndex((o) => o === value);
    setActiveIdx(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function closePanel() {
    setOpen(false);
    setQuery("");
    setActiveIdx(-1);
    onBlur?.();
  }

  function onQueryChange(next: string) {
    setQuery(next);
    const matches = filterFor(next);
    setActiveIdx(matches.length > 0 ? 0 : -1);
  }

  // Close on outside click. (Effect only registers/removes the listener — no
  // setState inside the effect body; closePanel is invoked from the callback.)
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        closePanel();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // closePanel is stable per render and only reads from current closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll active option into view (no setState — DOM side effect only).
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    const node = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx]);

  function commit(opt: string) {
    onChange(opt);
    closePanel();
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    // Opening shortcuts only — once open, the search input owns keyboard.
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openPanel();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      closePanel();
    }
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIdx];
      if (opt !== undefined) commit(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(filtered.length - 1);
    } else if (e.key === "Tab") {
      // Allow tab to close the panel naturally.
      closePanel();
    }
  }

  const hasValue = value !== "";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-invalid={invalid ? "true" : undefined}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={onTriggerKeyDown}
        className={clsx(
          "flex w-full cursor-pointer items-center gap-2 rounded-full border bg-bg-elevated pl-1 pr-1 text-left transition sm:gap-3",
          open
            ? invalid
              ? "border-danger"
              : "border-accent-primary"
            : invalid
              ? "border-danger/60"
              : hasValue
                ? "border-accent-primary/50 hover:border-accent-primary"
                : "border-ink-500/20 hover:border-ink-500/40",
        )}
      >
        <IconCircle icon={icon} invalid={invalid} />
        <span
          className={clsx(
            "flex-1 truncate text-sm sm:text-base",
            hasValue ? "text-ink-900" : "text-ink-500",
          )}
        >
          {hasValue ? value : placeholder}
        </span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.04] text-ink-500 transition sm:h-10 sm:w-10">
          <ChevronDown className={clsx("h-4 w-4 transition", open && "-rotate-180")} aria-hidden />
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-ink-500/15 bg-bg-elevated shadow-elev"
          role="presentation"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />

          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-ink-500/10 px-3 py-2 sm:px-4 sm:py-2.5">
            <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Type to filter…"
              autoComplete="off"
              spellCheck={false}
              aria-autocomplete="list"
              aria-controls={id ? `${id}-listbox` : undefined}
              aria-activedescendant={id && activeIdx >= 0 ? `${id}-option-${activeIdx}` : undefined}
              className="autofill-on-light h-8 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:h-9 sm:text-[15px]"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-4 text-center text-xs text-ink-500 sm:text-sm">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul
              ref={listRef}
              id={id ? `${id}-listbox` : undefined}
              role="listbox"
              className="max-h-64 overflow-y-auto py-1.5 sm:max-h-72"
            >
              {filtered.map((opt, idx) => {
                const selected = opt === value;
                const active = idx === activeIdx;
                return (
                  <li
                    key={opt}
                    id={id ? `${id}-option-${idx}` : undefined}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      // Prevent the search input's blur from racing the commit.
                      e.preventDefault();
                      commit(opt);
                    }}
                    className={clsx(
                      "flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm transition sm:py-2.5 sm:text-[15px]",
                      active && "bg-accent-primary/10 text-ink-900",
                      !active && "text-ink-700",
                    )}
                  >
                    <span className="truncate">{opt}</span>
                    {selected && (
                      <Check aria-hidden className="h-4 w-4 shrink-0 text-accent-primary" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
