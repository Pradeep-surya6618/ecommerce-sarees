import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types/domain";

export function BlogCard({ post }: { post: BlogPost }) {
  const date = new Date(post.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-ink-500/5">
        <Image
          src={post.coverImageUrl}
          alt={post.coverImageAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-accent-gold">{date}</span>
        <h3 className="font-display text-xl text-ink-900 transition group-hover:text-accent-primary">
          {post.title}
        </h3>
        <p className="text-sm text-ink-700">{post.excerpt}</p>
      </div>
    </Link>
  );
}
