import { clsx } from "@/lib/utils/clsx";

export interface NavTooltipProps {
  label: string;
  /** Where to render the tooltip relative to its `group` parent. Default "bottom". */
  position?: "top" | "bottom";
  /** Color variant. Default "primary" (deep emerald). Use "danger" for destructive actions. */
  tone?: "primary" | "danger";
}

export function NavTooltip({ label, position = "bottom", tone = "primary" }: NavTooltipProps) {
  return (
    <span
      aria-hidden
      className={clsx(
        // `nav-tooltip` is targeted by a globals.css media query that hides
        // tooltips on any touch-capable device (hover:none, pointer:coarse, or
        // any-pointer:coarse) with !important to beat utility classes.
        "nav-tooltip pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white opacity-0 shadow-md transition-opacity delay-100 duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
        position === "top" ? "bottom-full mb-2" : "top-full mt-2",
        tone === "danger" ? "bg-[#7a1812]" : "bg-accent-primary-hover",
      )}
    >
      {label}
    </span>
  );
}
