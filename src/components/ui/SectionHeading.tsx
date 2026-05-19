import { clsx } from "@/lib/utils/clsx";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-1.5 sm:gap-2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent-gold sm:text-xs">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-2xl leading-tight text-ink-900 sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-prose text-sm text-ink-700 sm:text-base">{description}</p>
      )}
    </div>
  );
}
