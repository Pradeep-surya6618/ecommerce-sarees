import { getCurrentUser } from "@/lib/auth/current-user";
import { productsRepo } from "@/lib/db/repos/products";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { parseShopFilters, serializeShopFilters } from "@/lib/utils/shop-filters";
import {
  getColorOptions,
  getFabricOptions,
  getOccasionOptions,
  PRICE_BUCKETS,
} from "@/lib/utils/shop-options";
import { FilterRail } from "@/components/storefront/FilterRail";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ShopHeader } from "@/components/storefront/ShopHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

export const metadata = {
  title: "Shop · Saree Store",
  description: "Browse our complete edit of handpicked sarees.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseShopFilters(rawParams);
  const user = await getCurrentUser();
  const [result, wishlistItems] = await Promise.all([
    productsRepo.search({
      fabrics: filters.fabrics.length > 0 ? filters.fabrics : undefined,
      colors: filters.colors.length > 0 ? filters.colors : undefined,
      occasions: filters.occasions.length > 0 ? filters.occasions : undefined,
      priceMinPaise: filters.priceMinPaise,
      priceMaxPaise: filters.priceMaxPaise,
      inStockOnly: filters.inStockOnly,
      sort: filters.sort,
      page: filters.page,
    }),
    user ? wishlistRepo.listByUser(user.id) : Promise.resolve([]),
  ]);
  const wishlistProductIds = new Set(wishlistItems.map((w) => w.productId));
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  const fabricOptions = getFabricOptions();
  const colorOptions = getColorOptions();
  const occasionOptions = getOccasionOptions();

  const buildHref = (page: number) => {
    const qs = serializeShopFilters({ ...filters, page });
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <ShopHeader
        title="All Sarees"
        description="Hand-picked weaves across silk, cotton, linen and designer drapes."
        resultCount={result.totalCount}
        fabricOptions={fabricOptions}
        colorOptions={colorOptions}
        occasionOptions={occasionOptions}
        priceBuckets={PRICE_BUCKETS}
      />

      <div className="grid gap-10 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden md:sticky md:top-24 md:block md:max-h-[calc(100vh-7rem)] md:self-start md:overflow-y-auto md:pr-1 scrollbar-hide">
          <FilterRail
            fabricOptions={fabricOptions}
            colorOptions={colorOptions}
            occasionOptions={occasionOptions}
            priceBuckets={PRICE_BUCKETS}
          />
        </aside>
        <div className="flex min-w-0 flex-col gap-12">
          {result.items.length === 0 ? (
            <EmptyState
              title="No sarees match these filters"
              description="Try removing a filter or two to see more."
            />
          ) : (
            <ProductGrid products={result.items} wishlistProductIds={wishlistProductIds} />
          )}
          <Pagination currentPage={result.page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </Container>
  );
}
