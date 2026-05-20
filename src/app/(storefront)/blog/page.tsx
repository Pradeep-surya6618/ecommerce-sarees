import { blogPostsRepo } from "@/lib/db/repos/blog-posts";
import { BlogCard } from "@/components/storefront/BlogCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Journal · Saree Store",
  description: "Notes on weaves, care, and the craft of choosing a saree.",
};

export default async function BlogIndexPage() {
  const posts = await blogPostsRepo.listPublished();
  const [first, ...rest] = posts;
  return (
    <Container size="xl" className="py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal" }]} />
      <header className="mt-5 flex flex-col gap-1.5 sm:mt-6 sm:gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-accent-gold sm:text-xs">
          The Journal
        </span>
        <h1 className="font-display text-2xl text-ink-900 sm:text-3xl md:text-5xl">
          Notes on weaves, craft, and care.
        </h1>
      </header>
      {first && (
        <section className="mt-12">
          <BlogCard post={first} />
        </section>
      )}
      <section className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <BlogCard key={p.id} post={p} />
        ))}
      </section>
    </Container>
  );
}
