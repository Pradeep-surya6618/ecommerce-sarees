import { bannersRepo } from "@/lib/db/repos/banners";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { BannerHero } from "@/components/storefront/BannerHero";
import { CategoryTile } from "@/components/storefront/CategoryTile";
import { CollectionRail } from "@/components/storefront/CollectionRail";
import { EditorsPicks } from "@/components/storefront/EditorsPicks";
import { ExploreAllCTA } from "@/components/storefront/ExploreAllCTA";
import { InstagramStrip } from "@/components/storefront/InstagramStrip";
import { PriceTierTiles } from "@/components/storefront/PriceTierTiles";
import { ProductCard } from "@/components/storefront/ProductCard";
import { RegionTiles } from "@/components/storefront/RegionTiles";
import { ReviewCarousel } from "@/components/storefront/ReviewCarousel";
import { StorytellerSection } from "@/components/storefront/StorytellerSection";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default async function HomePage() {
  const [heroBanners, categories, featured, newest, reviews, settings] = await Promise.all([
    bannersRepo.listByPlacement("home-hero"),
    categoriesRepo.listTopLevel(),
    productsRepo.listFeatured({ limit: 8 }),
    productsRepo.list({ limit: 8 }),
    reviewsRepo.listFeatured({ limit: 6 }),
    siteSettingsRepo.get(),
  ]);

  return (
    <>
      <BannerHero banners={heroBanners} />

      {/* Shop by Craft */}
      <section className="py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Shop by craft"
            title="Explore the edit"
            description="Categories curated for the way you wear sarees."
            className="mb-10"
          />
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat) => (
              <CategoryTile key={cat.slug} category={cat} />
            ))}
          </div>
        </Container>
      </section>

      {/* Shop by Roots */}
      <section className="bg-bg-elevated py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Shop by roots"
            title="Crafts by region"
            description="Each weave belongs to a place. Browse by where it's made."
            className="mb-10"
          />
          <RegionTiles />
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

      {/* Shop by Cost */}
      <section className="py-20">
        <Container size="xl">
          <SectionHeading
            eyebrow="Shop by cost"
            title="Find your range"
            description="From everyday cottons to heirloom Kanjivarams."
            className="mb-10"
          />
          <PriceTierTiles />
        </Container>
      </section>

      <StorytellerSection />

      <EditorsPicks products={featured} />

      {/* Community — reviews + instagram (each carries its own eyebrow + heading) */}
      <ReviewCarousel reviews={reviews} />
      <InstagramStrip settings={settings.instagram} />

      {/* Explore all */}
      <ExploreAllCTA />
    </>
  );
}
