import { forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid ? "true" : undefined}
      className={clsx(
        "h-11 w-full rounded-sm border bg-bg-elevated px-3 text-base text-ink-900 transition placeholder:text-ink-500",
        "focus:border-accent-primary focus:outline-none",
        invalid ? "border-danger focus:border-danger" : "border-ink-500/30",
        className,
      )}
      {...rest}
    />
  );
});
