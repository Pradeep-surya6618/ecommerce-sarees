interface SectionFlourishHeadingProps {
  title: string;
}

export function SectionFlourishHeading({ title }: SectionFlourishHeadingProps) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <h2 className="font-display text-3xl text-ink-900 md:text-4xl">{title}</h2>
      <svg
        aria-hidden
        viewBox="0 0 120 16"
        className="h-4 w-32 text-accent-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M2 8 Q 20 0 38 8" />
        <path d="M82 8 Q 100 16 118 8" />
        <path
          d="M60 13 c -3 -3 -8 -5 -8 -9 a 4 4 0 0 1 8 -2 a 4 4 0 0 1 8 2 c 0 4 -5 6 -8 9 z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    </header>
  );
}
