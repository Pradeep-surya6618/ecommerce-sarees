import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import { MarkdownContent } from "@/components/storefront/MarkdownContent";
import { ProsePage } from "@/components/storefront/ProsePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await contentPagesRepo.getBySlug(slug);
  if (!page) return { title: "Page not found" };
  return { title: `${page.title} · Saree Store` };
}

export default async function ContentPageRoute({ params }: PageProps) {
  const { slug } = await params;
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
