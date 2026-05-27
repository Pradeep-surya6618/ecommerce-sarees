"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface PillDateInputProps {
  id?: string;
  /** ISO date — `yyyy-mm-dd`. Empty string means unset. */
  value: string;
  /** Fired with `yyyy-mm-dd` or `""` when the admin clears it. */
  onChange: (next: string) => void;
  /** RHF compatibility — call when the picker closes so validation runs. */
  onBlur?: () => void;
  /** Lower bound (inclusive) as `yyyy-mm-dd`. Days before are non-selectable. */
  min?: string;
  /** Upper bound (inclusive) as `yyyy-mm-dd`. Days after are non-selectable. */
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
}

// Custom calendar replacement for `<input type="date">` so the picker matches
// the rest of the admin (pill borders, accent-purple selection, gold hover,
// matching typography). Native pickers can't be themed beyond a handful of
// `::-webkit-calendar-picker-indicator` knobs — easier to build the seven-by-
// six grid here than fight the browser.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function parseIsoDate(value: string): { year: number; month0: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month0: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function isSameDay(
  a: { year: number; month0: number; day: number } | null,
  b: { year: number; month0: number; day: number } | null,
): boolean {
  if (!a || !b) return false;
  return a.year === b.year && a.month0 === b.month0 && a.day === b.day;
}

function daysInMonth(year: number, month0: number): number {
  // Day 0 of next month = last day of current month.
  return new Date(year, month0 + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month0: number): number {
  return new Date(year, month0, 1).getDay();
}

function formatDisplay(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return "";
  return `${pad2(parsed.day)}-${pad2(parsed.month0 + 1)}-${parsed.year}`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Approximate height of the calendar popover at default density. Used to
// decide whether it fits below the trigger or should flip above. Slight
// over-estimate is fine — better to flip eagerly than have the panel clipped
// by the viewport.
const POPOVER_HEIGHT_PX = 380;

export function PillDateInput({
  id,
  value,
  onChange,
  onBlur,
  min,
  max,
  placeholder = "Select a date",
  invalid,
  disabled,
}: PillDateInputProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"below" | "above">("below");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const parsedValue = useMemo(() => parseIsoDate(value), [value]);
  const parsedMin = useMemo(() => (min ? parseIsoDate(min) : null), [min]);
  const parsedMax = useMemo(() => (max ? parseIsoDate(max) : null), [max]);

  // Calendar view state — defaults to the selected month or today.
  const initialView =
    parsedValue ??
    (() => {
      const now = new Date();
      return { year: now.getFullYear(), month0: now.getMonth(), day: now.getDate() };
    })();
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth0, setViewMonth0] = useState(initialView.month0);

  // When the bound `value` changes externally (e.g. RHF reset), re-sync the
  // visible month. Done during render via the "adjust state when a prop
  // changes" pattern (https://react.dev/learn/you-might-not-need-an-effect)
  // rather than in an effect — a synchronous setState inside useEffect trips
  // the react-hooks/set-state-in-effect rule and causes a cascading render.
  const [lastSyncedValue, setLastSyncedValue] = useState(value);
  if (value !== lastSyncedValue) {
    setLastSyncedValue(value);
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth0(parsedValue.month0);
    }
  }

  // Outside click + Esc close the panel.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onBlur]);

  // Choose above/below when the panel opens. The default ("below") is fine
  // for most fields high up the page; flip when the trigger sits in the
  // bottom third of the viewport and there's clearly more headroom above.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < POPOVER_HEIGHT_PX && spaceAbove > spaceBelow) {
      setPlacement("above");
    } else {
      setPlacement("below");
    }
  }, [open]);

  function gotoPrevMonth() {
    if (viewMonth0 === 0) {
      setViewMonth0(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth0((m) => m - 1);
    }
  }
  function gotoNextMonth() {
    if (viewMonth0 === 11) {
      setViewMonth0(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth0((m) => m + 1);
    }
  }

  function pick(day: number) {
    const iso = toIsoDate(viewYear, viewMonth0, day);
    onChange(iso);
    setOpen(false);
    onBlur?.();
  }
  function pickToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth0(now.getMonth());
    pick(now.getDate());
  }
  function clear() {
    onChange("");
    setOpen(false);
    onBlur?.();
  }

  function dayOutOfBounds(year: number, month0: number, day: number): boolean {
    const candidate = { year, month0, day };
    if (parsedMin) {
      const cmp =
        candidate.year - parsedMin.year ||
        candidate.month0 - parsedMin.month0 ||
        candidate.day - parsedMin.day;
      if (cmp < 0) return true;
    }
    if (parsedMax) {
      const cmp =
        candidate.year - parsedMax.year ||
        candidate.month0 - parsedMax.month0 ||
        candidate.day - parsedMax.day;
      if (cmp > 0) return true;
    }
    return false;
  }

  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth(), day: now.getDate() };
  }, []);

  const firstOffset = firstWeekdayOfMonth(viewYear, viewMonth0);
  const monthLength = daysInMonth(viewYear, viewMonth0);
  // Leading blanks let us slot the 1st under the right weekday column.
  const cells: Array<{ day: number; year: number; month0: number; outside: boolean } | null> = [];
  for (let i = 0; i < firstOffset; i++) cells.push(null);
  for (let d = 1; d <= monthLength; d++) {
    cells.push({ day: d, year: viewYear, month0: viewMonth0, outside: false });
  }
  // Pad to a full 6-week grid so the popover height never jumps.
  while (cells.length < 42) cells.push(null);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={clsx(
          "flex w-full cursor-pointer items-center gap-2 rounded-full border bg-bg-elevated pl-1 pr-4 text-left transition sm:gap-3 sm:pr-5",
          disabled && "cursor-not-allowed opacity-60",
          invalid
            ? "border-danger/60"
            : open
              ? "border-accent-primary"
              : "border-ink-500/20 hover:border-accent-primary/60",
        )}
      >
        <span
          className={clsx(
            "pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
            invalid ? "bg-danger/15 text-danger" : "bg-ink-900/[0.06] text-accent-primary",
          )}
        >
          <Calendar className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <span
          className={clsx(
            "flex h-11 flex-1 items-center text-sm sm:h-12 sm:text-base",
            value ? "text-ink-900" : "text-ink-500",
          )}
        >
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className={clsx(
            "absolute left-0 z-40 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink-500/15 bg-bg-elevated shadow-[0_20px_50px_-12px_rgba(37,31,62,0.35)] ring-1 ring-ink-900/5",
            placement === "below" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]",
          )}
        >
          {/* Top hairline matches the rest of the admin surfaces. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />

          <div className="flex items-center justify-between gap-2 border-b border-ink-500/10 px-3 py-2.5">
            <button
              type="button"
              onClick={gotoPrevMonth}
              aria-label="Previous month"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-accent-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-ink-900">
              {MONTH_NAMES[viewMonth0]} {viewYear}
            </span>
            <button
              type="button"
              onClick={gotoNextMonth}
              aria-label="Next month"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/[0.06] hover:text-accent-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 pt-2 pb-1">
            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500"
                >
                  {d.slice(0, 2)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((cell, idx) => {
                if (!cell) return <div key={`b-${idx}`} className="h-9" aria-hidden />;
                const selected = isSameDay(parsedValue, cell);
                const isToday = isSameDay(today, cell);
                const oob = dayOutOfBounds(cell.year, cell.month0, cell.day);
                return (
                  <button
                    key={`d-${cell.day}`}
                    type="button"
                    onClick={() => pick(cell.day)}
                    disabled={oob}
                    aria-pressed={selected}
                    aria-current={isToday ? "date" : undefined}
                    className={clsx(
                      "inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md text-sm transition",
                      selected
                        ? "bg-accent-primary text-white shadow-[0_4px_12px_-6px_rgba(91,58,138,0.6)]"
                        : isToday
                          ? "border border-accent-gold/60 text-ink-900 hover:bg-accent-gold/10"
                          : "text-ink-700 hover:bg-ink-900/[0.06] hover:text-ink-900",
                      oob && "cursor-not-allowed opacity-30 hover:bg-transparent",
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-ink-500/10 px-3 py-2">
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500 transition hover:text-danger"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={pickToday}
              className="inline-flex h-8 cursor-pointer items-center rounded-full bg-accent-primary/10 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-accent-primary transition hover:bg-accent-primary/15"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
