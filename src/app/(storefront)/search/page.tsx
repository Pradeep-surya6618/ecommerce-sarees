import { productsRepo } from "@/lib/db/repos/products";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SearchInput } from "@/components/storefront/SearchInput";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Search · Saree Store",
  description: "Search across our sarees by name, fabric, occasion, or colour.",
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const result = query
    ? await productsRepo.search({ q: query, pageSize: 24 })
    : { items: [], totalCount: 0, page: 1, pageSize: 24, hasMore: false };

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <header className="mt-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl text-ink-900 md:text-4xl">Search</h1>
        <SearchInput defaultQuery={query} />
        {query && (
          <p className="text-sm text-ink-500">
            {result.totalCount} {result.totalCount === 1 ? "result" : "results"} for{" "}
            <span className="text-ink-900">&ldquo;{query}&rdquo;</span>
          </p>
        )}
      </header>

      <div className="mt-10">
        {!query ? (
          <EmptyState
            title="Start typing to search"
            description="Try a fabric (silk, linen), an occasion (wedding, office), or a colour (maroon, sage)."
          />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="No sarees match your search"
            description="Try a different word, or browse the full edit."
          />
        ) : (
          <ProductGrid products={result.items} />
        )}
      </div>
    </Container>
  );
}
