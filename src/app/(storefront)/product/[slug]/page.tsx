import { notFound } from "next/navigation";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { PincodeChecker } from "@/components/storefront/PincodeChecker";
import { ProductBuyBox } from "@/components/storefront/ProductBuyBox";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { RelatedProducts } from "@/components/storefront/RelatedProducts";
import { ReviewList } from "@/components/storefront/ReviewList";
import { ReviewSummary } from "@/components/storefront/ReviewSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";

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

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await productsRepo.getBySlug(slug);
  if (!product) notFound();

  const [category, related, reviews] = await Promise.all([
    categoriesRepo.getBySlug(product.categorySlug),
    productsRepo.listByCategory(product.categorySlug, { limit: 8 }),
    reviewsRepo.listByProduct(product.id),
  ]);
  const recommendations = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <Container size="xl" className="py-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(category ? [{ label: category.name, href: `/shop/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <ProductGallery images={product.images} productName={product.name} />

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">
                {product.fabric}
              </span>
              <h1 className="font-display text-3xl text-ink-900 md:text-4xl">{product.name}</h1>
              <p className="text-sm text-ink-700">{product.description}</p>
            </div>

            <ProductBuyBox product={product} />

            <PincodeChecker />
          </div>
        </div>

        <div className="mt-20">
          <Tabs defaultValue="description">
            <TabList>
              <Tab value="description">Description</Tab>
              <Tab value="care">Fabric &amp; care</Tab>
              <Tab value="shipping">Shipping &amp; returns</Tab>
            </TabList>
            <TabPanel value="description">
              <p className="max-w-prose">{product.description}</p>
            </TabPanel>
            <TabPanel value="care">
              <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
                <li>Fabric: {product.fabric}</li>
                <li>Dry clean only for the first wash; gentle hand-wash thereafter.</li>
                <li>Iron on the reverse side at low temperature.</li>
                <li>Store folded with a soft cotton wrap; avoid direct sunlight.</li>
              </ul>
            </TabPanel>
            <TabPanel value="shipping">
              <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
                <li>Free shipping on orders over ₹2,000 anywhere in India.</li>
                <li>Cash on delivery available across most pincodes.</li>
                <li>7-day return window from the date of delivery.</li>
                <li>Made-to-order pieces are non-returnable.</li>
              </ul>
            </TabPanel>
          </Tabs>
        </div>

        <div className="mt-20 grid gap-12 md:grid-cols-[1fr_2fr]">
          <ReviewSummary reviews={reviews} />
          <ReviewList reviews={reviews} />
        </div>
      </Container>

      <RelatedProducts products={recommendations} />
    </>
  );
}
