import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  size?: "sm" | "md";
}

const sizeClass: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-base",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, size = "md", className, children, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-ink-700">{label}</span>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            "w-full appearance-none rounded-sm border border-ink-500/30 bg-bg-elevated pl-3 pr-10 text-ink-900 transition",
            "focus:border-accent-primary focus:outline-none",
            sizeClass[size],
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
        />
      </div>
    </label>
  );
});
