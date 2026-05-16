import { forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

type Variant = "ghost" | "solid" | "outline";
type Size = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  "aria-label": string;
}

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const variantClass: Record<Variant, string> = {
  ghost: "bg-transparent text-ink-700 hover:bg-ink-900/5",
  solid: "bg-ink-900 text-white hover:bg-ink-700",
  outline: "border border-ink-500/30 text-ink-700 hover:bg-ink-900/5",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        "inline-flex items-center justify-center rounded-sm transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2",
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
