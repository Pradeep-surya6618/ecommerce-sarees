import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductReviews } from "@/components/storefront/ProductReviews";
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

  const user = await getCurrentUser();
  const [category, related, wishlistItems, reviews] = await Promise.all([
    categoriesRepo.getBySlug(product.categorySlug),
    productsRepo.listByCategory(product.categorySlug, { limit: 8 }),
    user ? wishlistRepo.listByUser(user.id) : Promise.resolve([]),
    reviewsRepo.listByProduct(product.id),
  ]);
  const recommendations = related.filter((p) => p.id !== product.id);
  const categoryLabel = category?.name ?? titleCase(product.categorySlug.replace(/-/g, " "));
  const galleryBadge = product.tags[0] ? titleCase(product.tags[0]) : categoryLabel;
  const initiallyInWishlist = wishlistItems.some((w) => w.productId === product.id);
  const myReview = user ? (reviews.find((r) => r.userId === user.id) ?? null) : null;

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

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-start lg:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery images={product.images} productName={product.name} badge={galleryBadge} />
        </div>
        <ProductBuyBox product={product} initiallyInWishlist={initiallyInWishlist} />
      </div>

      <div className="mt-16">
        <ProductSpecifications product={product} />
      </div>

      <section className="mt-12 sm:mt-16">
        <SectionFlourishHeading title="Ratings & Reviews" />
        <div className="mt-6 sm:mt-8">
          <ProductReviews
            productId={product.id}
            reviews={reviews}
            myReview={myReview}
            isSignedIn={!!user}
          />
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="mt-10 sm:mt-16 md:mt-20">
          <SectionFlourishHeading title="You May Also Like" />
          <div className="mt-5 sm:mt-8 md:mt-10">
            <RelatedProductsCarousel products={recommendations} categoryName={categoryLabel} />
          </div>
        </section>
      )}
    </Container>
  );
}
