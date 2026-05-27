import { productsRepo } from "@/lib/db/repos/products";
import { reviewsRepo } from "@/lib/db/repos/reviews";
import { ReviewsListClient, type AdminReviewRow } from "@/components/admin/ReviewsListClient";

export const metadata = { title: "Reviews · Admin" };

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([
    reviewsRepo.listAll(),
    productsRepo.listAll({ includeArchived: true }),
  ]);

  // Map productId → name/slug so the moderation list reads meaningfully.
  const byId = new Map(products.map((p) => [p.id, p]));
  const rows: AdminReviewRow[] = reviews.map((r) => {
    const product = r.productId ? byId.get(r.productId) : undefined;
    return {
      ...r,
      productName: product?.name ?? "(unknown product)",
      productSlug: product?.slug ?? null,
    };
  });

  return <ReviewsListClient reviews={rows} />;
}
