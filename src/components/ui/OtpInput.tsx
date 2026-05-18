"use client";

import { useCallback, useEffect, useRef } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid,
  autoFocus = true,
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

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex gap-2">
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
            "h-12 w-12 rounded-sm border text-center text-xl font-semibold tabular-nums transition",
            "focus:border-accent-primary focus:outline-none",
            invalid ? "border-danger" : "border-ink-500/30",
          )}
        />
      ))}
    </div>
  );
}
