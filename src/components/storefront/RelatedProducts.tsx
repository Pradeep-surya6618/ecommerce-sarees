import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="py-20">
      <Container size="xl">
        <SectionHeading
          eyebrow="You may also like"
          title="More from this collection"
          className="mb-10"
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
