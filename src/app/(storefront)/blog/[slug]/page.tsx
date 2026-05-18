import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPostsRepo } from "@/lib/db/repos/blog-posts";
import { BlogBody } from "@/components/storefront/BlogBody";
import { BlogCard } from "@/components/storefront/BlogCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await blogPostsRepo.getBySlug(slug);
  if (!post) return { title: "Journal · Saree Store" };
  return {
    title: `${post.title} · Saree Store`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImageUrl }],
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await blogPostsRepo.getBySlug(slug);
  if (!post) notFound();
  const related = await blogPostsRepo.listRelated(slug, { limit: 3 });
  const date = new Date(post.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Container size="md" className="py-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Journal", href: "/blog" },
            { label: post.title },
          ]}
        />
        <article className="mt-8 flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">{date}</span>
            <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{post.title}</h1>
            <p className="text-ink-700">{post.excerpt}</p>
            <span className="text-sm text-ink-500">By {post.authorName}</span>
          </header>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-ink-500/5">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              priority
              className="object-cover"
            />
          </div>
          <BlogBody body={post.body} />
          <div className="flex flex-wrap gap-2 pt-4">
            {post.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        </article>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-ink-500/10 py-16">
          <Container size="xl">
            <h2 className="mb-8 font-display text-2xl text-ink-900">More from the Journal</h2>
            <div className="grid gap-10 md:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-sm border border-ink-900 px-5 py-2.5 text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white"
              >
                All posts
              </Link>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
