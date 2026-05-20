"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { parseShopFilters, serializeShopFilters, type ShopFilters } from "@/lib/utils/shop-filters";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

/** Premium custom checkbox — hides the native widget and renders our own
 *  rounded box that fills with accent-primary and shows a white check. The
 *  native input still drives keyboard/screen-reader behaviour. */
function PremiumCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 transition hover:text-ink-900">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className={clsx(
            "peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 bg-bg-base transition",
            "border-ink-500/25 group-hover:border-accent-primary/50",
            "checked:border-accent-primary checked:bg-accent-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-1",
          )}
        />
        <Check
          aria-hidden
          className="pointer-events-none absolute h-3 w-3 scale-50 text-white opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
          strokeWidth={3}
        />
      </span>
      {label}
    </label>
  );
}

/** Premium custom radio — round companion to PremiumCheckbox. */
function PremiumRadio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 transition hover:text-ink-900">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className={clsx(
            "peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 bg-bg-base transition",
            "border-ink-500/25 group-hover:border-accent-primary/50",
            "checked:border-accent-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-1",
          )}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute h-2 w-2 scale-50 rounded-full bg-accent-primary opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
}

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
  /** When the rail is nested inside a Sheet that already shows "Filter" in its
   *  header, hide the duplicate heading and just render the Clear-all action. */
  hideHeading?: boolean;
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
  hideHeading,
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
      <div
        className={clsx("flex items-center pb-2", hideHeading ? "justify-end" : "justify-between")}
      >
        {!hideHeading && <h2 className="font-display text-xl text-ink-900">Filter</h2>}
        <button
          type="button"
          onClick={() =>
            apply({ fabrics: [], colors: [], occasions: [], sort: filters.sort, page: 1 })
          }
          className="cursor-pointer text-xs uppercase tracking-wide text-ink-500 transition hover:text-ink-900"
        >
          Clear all
        </button>
      </div>

      <Accordion>
        <AccordionItem title="Fabric" defaultOpen>
          <div className="flex flex-col gap-2.5 pt-1">
            {fabricOptions.map((opt) => (
              <PremiumCheckbox
                key={opt.value}
                checked={filters.fabrics.includes(opt.value)}
                onChange={() =>
                  apply({ ...filters, fabrics: toggleValue(filters.fabrics, opt.value) })
                }
                label={opt.label}
              />
            ))}
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
                    "h-8 w-8 cursor-pointer rounded-full border-2 transition",
                    active ? "border-ink-900" : "border-ink-500/20 hover:border-ink-700",
                  )}
                  style={{ background: c.hex }}
                />
              );
            })}
          </div>
        </AccordionItem>

        <AccordionItem title="Occasion">
          <div className="flex flex-col gap-2.5 pt-1">
            {occasionOptions.map((opt) => (
              <PremiumCheckbox
                key={opt.value}
                checked={filters.occasions.includes(opt.value)}
                onChange={() =>
                  apply({ ...filters, occasions: toggleValue(filters.occasions, opt.value) })
                }
                label={opt.label}
              />
            ))}
          </div>
        </AccordionItem>

        <AccordionItem title="Price">
          <div className="flex flex-col gap-2.5 pt-1">
            {priceBuckets.map((b) => (
              <PremiumRadio
                key={b.label}
                name="price"
                checked={filters.priceMinPaise === b.min && filters.priceMaxPaise === b.max}
                onChange={() => apply({ ...filters, priceMinPaise: b.min, priceMaxPaise: b.max })}
                label={b.label}
              />
            ))}
            <button
              type="button"
              onClick={() =>
                apply({ ...filters, priceMinPaise: undefined, priceMaxPaise: undefined })
              }
              className="mt-1 cursor-pointer self-start text-xs uppercase tracking-wide text-ink-500 transition hover:text-ink-900"
            >
              Clear price
            </button>
          </div>
        </AccordionItem>

        <AccordionItem title="Availability">
          <div className="pt-1">
            <PremiumCheckbox
              checked={!!filters.inStockOnly}
              onChange={() =>
                apply({ ...filters, inStockOnly: !filters.inStockOnly ? true : undefined })
              }
              label="In stock only"
            />
          </div>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
