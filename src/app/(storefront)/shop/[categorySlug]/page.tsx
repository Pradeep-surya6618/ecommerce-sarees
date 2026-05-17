import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
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

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { categorySlug } = await params;
  const category = await categoriesRepo.getBySlug(categorySlug);
  if (!category) return { title: "Shop · Saree Store" };
  return {
    title: `${category.name} · Saree Store`,
    description: category.description,
  };
}

export default async function CategoryShopPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const category = await categoriesRepo.getBySlug(categorySlug);
  if (!category) notFound();

  const rawParams = await searchParams;
  const filters = parseShopFilters(rawParams);

  const result = await productsRepo.search({
    categorySlugs: [category.slug],
    fabrics: filters.fabrics.length > 0 ? filters.fabrics : undefined,
    colors: filters.colors.length > 0 ? filters.colors : undefined,
    occasions: filters.occasions.length > 0 ? filters.occasions : undefined,
    priceMinPaise: filters.priceMinPaise,
    priceMaxPaise: filters.priceMaxPaise,
    inStockOnly: filters.inStockOnly,
    sort: filters.sort,
    page: filters.page,
  });
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  const fabricOptions = getFabricOptions();
  const colorOptions = getColorOptions();
  const occasionOptions = getOccasionOptions();

  const buildHref = (page: number) => {
    const qs = serializeShopFilters({ ...filters, page });
    return qs ? `/shop/${category.slug}?${qs}` : `/shop/${category.slug}`;
  };

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name },
        ]}
      />
      <ShopHeader
        title={category.name}
        description={category.description}
        resultCount={result.totalCount}
        fabricOptions={fabricOptions}
        colorOptions={colorOptions}
        occasionOptions={occasionOptions}
        priceBuckets={PRICE_BUCKETS}
      />

      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <FilterRail
            fabricOptions={fabricOptions}
            colorOptions={colorOptions}
            occasionOptions={occasionOptions}
            priceBuckets={PRICE_BUCKETS}
          />
        </div>
        <div className="flex flex-col gap-12">
          {result.items.length === 0 ? (
            <EmptyState
              title="No sarees match these filters"
              description="Try removing a filter or two to see more."
            />
          ) : (
            <ProductGrid products={result.items} />
          )}
          <Pagination currentPage={result.page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </Container>
  );
}
