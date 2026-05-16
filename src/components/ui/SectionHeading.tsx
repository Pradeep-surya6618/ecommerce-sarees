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
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">{eyebrow}</span>
      )}
      <h2 className="font-display text-3xl text-ink-900 md:text-4xl">{title}</h2>
      {description && <p className="max-w-prose text-ink-700">{description}</p>}
    </div>
  );
}
