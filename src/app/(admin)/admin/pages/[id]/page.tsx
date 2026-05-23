import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import { ContentPageEditor } from "@/components/admin/ContentPageEditor";

export const metadata = { title: "Edit page · Admin" };

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditPage({ params }: EditPageProps) {
  const { id } = await params;
  const page = await contentPagesRepo.getById(id);
  if (!page) notFound();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        href="/admin/pages"
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs text-ink-500 transition hover:text-ink-900 sm:text-sm"
      >
        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        All pages
      </Link>
      <header className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">
            Edit · {page.title}
          </h1>
          <Link
            href={`/p/${page.slug}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/20 bg-bg-elevated px-3 py-1 text-[10px] font-medium text-ink-700 transition hover:border-accent-primary hover:bg-accent-primary/5 hover:text-accent-primary sm:px-3.5 sm:py-1.5 sm:text-[11px]"
          >
            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            View page
          </Link>
        </div>
        <p className="text-[11px] text-ink-500 sm:text-xs">
          Public URL: <span className="font-mono">/p/{page.slug}</span>
        </p>
      </header>
      <ContentPageEditor mode="edit" initial={page} />
    </div>
  );
}
