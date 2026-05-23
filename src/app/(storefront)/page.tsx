import { getCurrentUser } from "@/lib/auth/current-user";
import { bannersRepo } from "@/lib/db/repos/banners";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { productsRepo } from "@/lib/db/repos/products";
import { regionsRepo } from "@/lib/db/repos/regions";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { wishlistRepo } from "@/lib/db/repos/wishlist";
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
import { SareeMotifBg } from "@/components/storefront/SareeMotifBg";
import { StorytellerSection } from "@/components/storefront/StorytellerSection";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [heroBanners, categories, regions, featured, newest, reviews, settings, wishlistItems] =
    await Promise.all([
      bannersRepo.listByPlacement("home-hero"),
      categoriesRepo.listTopLevel(),
      regionsRepo.listActive(),
      productsRepo.listFeatured({ limit: 8 }),
      productsRepo.list({ limit: 8 }),
      reviewsRepo.listFeatured({ limit: 6 }),
      siteSettingsRepo.get(),
      user ? wishlistRepo.listByUser(user.id) : Promise.resolve([]),
    ]);
  const wishlistProductIds = new Set(wishlistItems.map((w) => w.productId));

  return (
    <>
      <BannerHero banners={heroBanners} />

      {/* Shop by Craft */}
      <section className="relative overflow-hidden py-20">
        <SareeMotifBg
          id="shop-by-craft"
          variant="diamond"
          tileSize={220}
          className="text-accent-primary opacity-[0.18]"
        />
        <Container size="xl" className="relative">
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

      {/* Shop by Roots — hidden until the admin adds at least one active region. */}
      {regions.length > 0 && (
        <section className="bg-bg-elevated py-20">
          <Container size="xl">
            <SectionHeading
              eyebrow="Shop by roots"
              title="Crafts by region"
              description="Each weave belongs to a place. Browse by where it's made."
              className="mb-10"
            />
            <RegionTiles regions={regions} />
          </Container>
        </section>
      )}

      <CollectionRail
        eyebrow="Just in"
        title="New arrivals"
        description="The most recent additions to our edit."
        motif="star"
        motifId="new-arrivals"
        motifTileSize={240}
      >
        {newest.map((p) => (
          <div
            key={p.id}
            className="min-w-0 flex-[0_0_70%] snap-start md:flex-[0_0_30%] lg:flex-[0_0_22%]"
          >
            <ProductCard product={p} isInWishlist={wishlistProductIds.has(p.id)} />
          </div>
        ))}
      </CollectionRail>

      {/* Shop by Cost */}
      <section className="bg-bg-elevated py-20">
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

      <StorytellerSection about={settings.about} />

      <EditorsPicks products={featured} />

      {/* Community — reviews + instagram (each carries its own eyebrow + heading) */}
      <ReviewCarousel reviews={reviews} />
      <InstagramStrip settings={settings.instagram} />

      {/* Explore all */}
      <ExploreAllCTA />
    </>
  );
}
