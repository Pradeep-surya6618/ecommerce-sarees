import { Heart } from "lucide-react";
import { productsRepo } from "@/lib/db/repos/products";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = { title: "Component Showcase" };

export default async function DevUiPage() {
  const sample = await productsRepo.listFeatured({ limit: 4 });

  return (
    <Container size="xl" className="py-16">
      <SectionHeading
        eyebrow="Internal"
        title="Component showcase"
        description="A visual reference of every UI primitive and storefront section."
        className="mb-12"
      />

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">New</Badge>
          <Badge tone="gold">Bestseller</Badge>
          <Badge tone="success">In stock</Badge>
          <Badge tone="warning">Few left</Badge>
          <Badge tone="danger">Sold out</Badge>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip>Silk</Chip>
          <Chip selected>Cotton</Chip>
          <Chip>Linen</Chip>
          <Chip>Designer</Chip>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">PriceTag</h2>
        <div className="flex flex-col gap-4">
          <PriceTag priceInPaise={125000} size="sm" />
          <PriceTag priceInPaise={125000} mrpInPaise={150000} />
          <PriceTag priceInPaise={4250000} mrpInPaise={4800000} size="lg" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">IconButton</h2>
        <div className="flex items-center gap-3">
          <IconButton aria-label="Heart ghost" variant="ghost">
            <Heart className="h-5 w-5" />
          </IconButton>
          <IconButton aria-label="Heart outline" variant="outline">
            <Heart className="h-5 w-5" />
          </IconButton>
          <IconButton aria-label="Heart solid" variant="solid">
            <Heart className="h-5 w-5" />
          </IconButton>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">Skeleton</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">EmptyState</h2>
        <EmptyState
          title="Nothing here yet"
          description="Once products are added, you'll see them in this grid."
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl text-ink-900">ProductCard</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {sample.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Container>
  );
}
