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
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-1 text-xs text-ink-500 transition hover:text-ink-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All pages
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-ink-900">{page.title}</h1>
          <Link
            href={`/p/${page.slug}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-sm border border-ink-500/20 px-3 py-1.5 text-xs text-ink-700 transition hover:border-accent-primary hover:text-accent-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View page
          </Link>
        </div>
        <p className="text-sm text-ink-500">
          Public URL: <span className="font-mono">/p/{page.slug}</span>
        </p>
      </div>
      <ContentPageEditor mode="edit" initial={page} />
    </div>
  );
}
