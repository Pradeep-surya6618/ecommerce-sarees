import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import { productsRepo } from "@/lib/db/repos/products";
import type { NavMenuItem, Product } from "@/types/domain";

export interface MegaMenuChild {
  id: string;
  label: string;
  href: string;
}

export interface MegaMenuColumn {
  id: string;
  label: string;
  href: string;
  isCategory: boolean;
  children: MegaMenuChild[];
  trending: Product[];
}

const TRENDING_LIMIT = 6;
const TOP_LEVEL_LIMIT = 8;

function resolveHref(item: NavMenuItem): string {
  if (item.kind === "category" && item.categorySlug) return `/shop/${item.categorySlug}`;
  return item.href ?? "#";
}

export async function loadMegaMenu(): Promise<MegaMenuColumn[]> {
  const tree = await navMenuRepo.listTree(true);
  const topLevel = tree.slice(0, TOP_LEVEL_LIMIT);

  return Promise.all(
    topLevel.map(async ({ item, children }) => {
      const isCategory = item.kind === "category";
      const itemHref = resolveHref(item);
      // Trending strategy:
      //  - Category items → pull newest from this slug + any child category slugs
      //  - The system "Shop" item (href = /shop, no params) → pull newest across
      //    the whole catalog so the dropdown surfaces fresh stock
      let trending: Product[] = [];
      if (isCategory && item.categorySlug) {
        const childCategorySlugs = children
          .filter((c) => c.kind === "category" && c.categorySlug)
          .map((c) => c.categorySlug as string);
        const slugs = [item.categorySlug, ...childCategorySlugs];
        trending = await productsRepo.listByCategorySlugs(slugs, { limit: TRENDING_LIMIT });
      } else if (itemHref === "/shop") {
        trending = await productsRepo.list({ limit: TRENDING_LIMIT });
      }
      return {
        id: item.id,
        label: item.label,
        href: itemHref,
        isCategory,
        children: children.map((c) => ({
          id: c.id,
          label: c.label,
          href: resolveHref(c),
        })),
        trending,
      };
    }),
  );
}
