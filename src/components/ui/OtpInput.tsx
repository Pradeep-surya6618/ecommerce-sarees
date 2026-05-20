"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
  /** "light" (default) renders ink boxes on a light surface;
   *  "dark" renders glassy boxes for the dark auth card. */
  variant?: "light" | "dark";
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  autoFocus = true,
  variant = "light",
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setRef = useCallback(
    (idx: number) => (el: HTMLInputElement | null) => {
      refs.current[idx] = el;
    },
    [],
  );

  function handleChange(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = value.split("");
    while (next.length < length) next.push("");
    next[idx] = digit;
    const trimmed = next.slice(0, length).join("").replace(/\s+$/, "");
    onChange(trimmed);
    if (digit && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  }

  function fillFromString(raw: string) {
    const pasted = raw.replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fillFromString(e.clipboardData.getData("text"));
  }

  const [pasting, setPasting] = useState(false);
  async function pasteFromClipboard() {
    try {
      setPasting(true);
      const text = await navigator.clipboard.readText();
      fillFromString(text);
    } catch {
      refs.current[0]?.focus();
    } finally {
      setPasting(false);
    }
  }

  const isDark = variant === "dark";
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-2.5">
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={setRef(idx)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] ?? ""}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-invalid={invalid ? "true" : undefined}
            aria-label={`Digit ${idx + 1}`}
            className={clsx(
              "h-10 w-10 rounded-md border text-center text-lg font-semibold tabular-nums transition focus:outline-none sm:h-12 sm:w-11 sm:text-xl",
              isDark
                ? "border-bg-base/20 bg-bg-base/[0.06] text-bg-base focus:border-accent-gold"
                : "border-ink-500/30 bg-bg-base text-ink-900 focus:border-accent-primary",
              invalid && (isDark ? "border-danger/70" : "border-danger"),
            )}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={pasteFromClipboard}
        disabled={pasting}
        className={clsx(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] transition disabled:opacity-50 sm:text-[11px]",
          isDark
            ? "border-bg-base/15 bg-bg-base/[0.06] text-bg-base/75 hover:border-accent-gold hover:text-accent-gold"
            : "border-ink-500/20 bg-bg-base text-ink-700 hover:border-accent-primary hover:text-accent-primary",
        )}
      >
        <ClipboardPaste className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        {pasting ? "Pasting…" : "Paste code"}
      </button>
    </div>
  );
}
