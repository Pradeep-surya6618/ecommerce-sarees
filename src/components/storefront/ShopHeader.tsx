import { FilterDrawer, type FilterDrawerProps } from "./FilterDrawer";
import { SortDropdown } from "./SortDropdown";

export interface ShopHeaderProps extends FilterDrawerProps {
  title: string;
  description?: string;
  resultCount: number;
}

export function ShopHeader({ title, description, resultCount, ...filterProps }: ShopHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-8 pt-12 md:gap-6 md:pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{title}</h1>
        {description && <p className="max-w-prose text-ink-700">{description}</p>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-500">{resultCount} sarees</span>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <FilterDrawer {...filterProps} />
          </div>
          <SortDropdown />
        </div>
      </div>
    </header>
  );
}
