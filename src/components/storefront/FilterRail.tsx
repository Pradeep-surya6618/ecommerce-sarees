"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { clsx } from "@/lib/utils/clsx";
import { parseShopFilters, serializeShopFilters, type ShopFilters } from "@/lib/utils/shop-filters";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterRailProps {
  fabricOptions: FilterOption[];
  colorOptions: { value: string; hex: string }[];
  occasionOptions: FilterOption[];
  priceBuckets: { min: number; max: number; label: string }[];
  className?: string;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterRail({
  fabricOptions,
  colorOptions,
  occasionOptions,
  priceBuckets,
  className,
}: FilterRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const obj: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      obj[k] = v;
    });
    return parseShopFilters(obj);
  }, [searchParams]);

  const apply = useCallback(
    (next: ShopFilters) => {
      const reset: ShopFilters = { ...next, page: 1 };
      const qs = serializeShopFilters(reset);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  return (
    <aside className={clsx("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-display text-xl text-ink-900">Filter</h2>
        <button
          type="button"
          onClick={() =>
            apply({ fabrics: [], colors: [], occasions: [], sort: filters.sort, page: 1 })
          }
          className="text-xs uppercase tracking-wide text-ink-500 hover:text-ink-900"
        >
          Clear all
        </button>
      </div>

      <Accordion>
        <AccordionItem title="Fabric" defaultOpen>
          <div className="flex flex-col gap-2 pt-1">
            {fabricOptions.map((opt) => {
              const checked = filters.fabrics.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      apply({ ...filters, fabrics: toggleValue(filters.fabrics, opt.value) })
                    }
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Colour" defaultOpen>
          <div className="flex flex-wrap gap-2 pt-1">
            {colorOptions.map((c) => {
              const active = filters.colors.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.value}
                  aria-pressed={active}
                  onClick={() =>
                    apply({ ...filters, colors: toggleValue(filters.colors, c.value) })
                  }
                  className={clsx(
                    "h-8 w-8 rounded-full border-2 transition",
                    active ? "border-ink-900" : "border-ink-500/20 hover:border-ink-700",
                  )}
                  style={{ background: c.hex }}
                />
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Occasion">
          <div className="flex flex-col gap-2 pt-1">
            {occasionOptions.map((opt) => {
              const checked = filters.occasions.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      apply({ ...filters, occasions: toggleValue(filters.occasions, opt.value) })
                    }
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Price">
          <div className="flex flex-col gap-2 pt-1">
            {priceBuckets.map((b) => {
              const active = filters.priceMinPaise === b.min && filters.priceMaxPaise === b.max;
              return (
                <label key={b.label} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="radio"
                    name="price"
                    checked={active}
                    onChange={() =>
                      apply({ ...filters, priceMinPaise: b.min, priceMaxPaise: b.max })
                    }
                  />
                  {b.label}
                </label>
              );
            })}
            <button
              type="button"
              onClick={() =>
                apply({ ...filters, priceMinPaise: undefined, priceMaxPaise: undefined })
              }
              className="mt-1 self-start text-xs uppercase tracking-wide text-ink-500 hover:text-ink-900"
            >
              Clear price
            </button>
          </div>
        </AccordionItem>

        <AccordionItem title="Availability">
          <label className="flex items-center gap-2 pt-1 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={!!filters.inStockOnly}
              onChange={() =>
                apply({ ...filters, inStockOnly: !filters.inStockOnly ? true : undefined })
              }
            />
            In stock only
          </label>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
