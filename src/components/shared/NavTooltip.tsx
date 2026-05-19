export function NavTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-accent-primary-hover px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white opacity-0 shadow-md transition-opacity delay-100 duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}
