import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContentPageEditor } from "@/components/admin/ContentPageEditor";

export const metadata = { title: "New page · Admin" };

export default function AdminNewPagePage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        href="/admin/pages"
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs text-ink-500 transition hover:text-ink-900 sm:text-sm"
      >
        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        All pages
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">New page</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Create a markdown-driven content page. It&apos;ll be reachable at{" "}
          <span className="font-mono text-[10px] sm:text-xs">/p/&lt;slug&gt;</span> and can be
          placed in the footer.
        </p>
      </header>
      <ContentPageEditor mode="create" initial={null} />
    </div>
  );
}
