"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseShopFilters, serializeShopFilters, type ShopSort } from "@/lib/utils/shop-filters";
import { Select } from "@/components/ui/Select";

const OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "featured", label: "Featured" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    params[k] = v;
  });
  const filters = parseShopFilters(params);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = { ...filters, sort: e.target.value as ShopSort, page: 1 };
    const qs = serializeShopFilters(next);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select aria-label="Sort" size="sm" value={filters.sort} onChange={onChange}>
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
