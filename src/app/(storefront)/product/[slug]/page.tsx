import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductSpecifications } from "@/components/storefront/ProductSpecifications";
import { RelatedProductsCarousel } from "@/components/storefront/RelatedProductsCarousel";
import { SectionFlourishHeading } from "@/components/storefront/SectionFlourishHeading";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await productsRepo.getBySlug(slug);
  if (!product) return { title: "Product · Saree Store" };
  return {
    title: `${product.name} · Saree Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

function titleCase(s: string): string {
  return s.replace(/(^|\s|-)\S/g, (m) => m.toUpperCase());
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await productsRepo.getBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    categoriesRepo.getBySlug(product.categorySlug),
    productsRepo.listByCategory(product.categorySlug, { limit: 8 }),
  ]);
  const recommendations = related.filter((p) => p.id !== product.id);
  const categoryLabel = category?.name ?? titleCase(product.categorySlug.replace(/-/g, " "));
  const galleryBadge = product.tags[0] ? titleCase(product.tags[0]) : categoryLabel;

  return (
    <Container size="xl" className="py-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(category ? [{ label: category.name, href: `/shop/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} badge={galleryBadge} />
        <ProductBuyBox product={product} />
      </div>

      <div className="mt-16">
        <ProductSpecifications product={product} />
      </div>

      {recommendations.length > 0 && (
        <section className="mt-20">
          <SectionFlourishHeading title="You May Also Like" />
          <div className="mt-10">
            <RelatedProductsCarousel products={recommendations} categoryName={categoryLabel} />
          </div>
        </section>
      )}
    </Container>
  );
}
