import { FilterDrawer, type FilterDrawerProps } from "./FilterDrawer";
import { SortDropdown } from "./SortDropdown";

export interface ShopHeaderProps extends FilterDrawerProps {
  title: string;
  description?: string;
  resultCount: number;
}

export function ShopHeader({ title, description, resultCount, ...filterProps }: ShopHeaderProps) {
  return (
    <header className="flex flex-col gap-3 pb-6 pt-6 sm:gap-4 sm:pb-8 sm:pt-10 md:gap-6 md:pb-10 md:pt-12">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <h1 className="font-display text-xl leading-tight text-ink-900 sm:text-3xl md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-prose text-[11px] text-ink-700 sm:text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-ink-500 sm:text-sm">{resultCount} sarees</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="md:hidden">
            <FilterDrawer {...filterProps} />
          </div>
          <SortDropdown />
        </div>
      </div>
    </header>
  );
}
