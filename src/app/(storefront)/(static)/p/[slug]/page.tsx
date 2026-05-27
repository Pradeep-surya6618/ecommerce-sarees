import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import { MarkdownContent } from "@/components/storefront/MarkdownContent";
import { ProsePage } from "@/components/storefront/ProsePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Slugs that now have a dedicated, dynamic route — we redirect any stale
// `/p/<slug>` link to its proper home so old bookmarks, breadcrumbs, and
// admin-seeded content-page entries don't show outdated placeholder copy.
const DYNAMIC_REDIRECTS: Record<string, string> = {
  contact: "/contact",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (DYNAMIC_REDIRECTS[slug]) {
    return { title: "Contact us · Saree Store" };
  }
  const page = await contentPagesRepo.getBySlug(slug);
  if (!page) return { title: "Page not found" };
  return { title: `${page.title} · Saree Store` };
}

export default async function ContentPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const target = DYNAMIC_REDIRECTS[slug];
  if (target) redirect(target);

  const page = await contentPagesRepo.getBySlug(slug);
  if (!page || !page.visible) notFound();

  return (
    <ProsePage
      title={page.title}
      breadcrumb={[{ label: "Home", href: "/" }, { label: page.title }]}
    >
      <MarkdownContent source={page.body} />
    </ProsePage>
  );
}
