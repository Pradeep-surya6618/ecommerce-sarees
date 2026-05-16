import { bannersRepo } from "@/lib/db/repos/banners";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { BannerHero } from "@/components/storefront/BannerHero";
import { CategoryTile } from "@/components/storefront/CategoryTile";
import { CollectionRail } from "@/components/storefront/CollectionRail";
import { InstagramStrip } from "@/components/storefront/InstagramStrip";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ReviewCarousel } from "@/components/storefront/ReviewCarousel";
import { StorytellerSection } from "@/components/storefront/StorytellerSection";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default async function HomePage() {
  const [heroBanners, categories, featured, newest, reviews] = await Promise.all([
    bannersRepo.listByPlacement("home-hero"),
    categoriesRepo.listTopLevel(),
    productsRepo.listFeatured({ limit: 8 }),
    productsRepo.list({ limit: 8 }),
    reviewsRepo.listFeatured({ limit: 6 }),
  ]);

  return (
    <>
      <BannerHero banners={heroBanners} />

      <section className="py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Shop by craft"
            title="Explore the edit"
            description="Categories curated for the way you wear sarees."
            className="mb-10"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {categories.slice(0, 6).map((cat) => (
              <CategoryTile key={cat.slug} category={cat} />
            ))}
          </div>
        </Container>
      </section>

      <CollectionRail
        eyebrow="Just in"
        title="New arrivals"
        description="The most recent additions to our edit."
      >
        {newest.map((p) => (
          <div
            key={p.id}
            className="min-w-0 flex-[0_0_70%] snap-start md:flex-[0_0_30%] lg:flex-[0_0_22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </CollectionRail>

      <StorytellerSection />

      <CollectionRail
        eyebrow="Editor's picks"
        title="Featured this season"
        description="Sarees we keep reaching for."
      >
        {featured.map((p) => (
          <div
            key={p.id}
            className="min-w-0 flex-[0_0_70%] snap-start md:flex-[0_0_30%] lg:flex-[0_0_22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </CollectionRail>

      <ReviewCarousel reviews={reviews} />

      <InstagramStrip />
    </>
  );
}
