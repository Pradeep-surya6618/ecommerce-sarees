import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContentPageEditor } from "@/components/admin/ContentPageEditor";

export const metadata = { title: "New page · Admin" };

export default function AdminNewPagePage() {
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
        <h1 className="mt-2 font-display text-3xl text-ink-900">New page</h1>
        <p className="text-sm text-ink-700">
          Create a markdown-driven content page. It&apos;ll be reachable at{" "}
          <span className="font-mono text-xs">/p/&lt;slug&gt;</span> and can be placed in the
          footer.
        </p>
      </div>
      <ContentPageEditor mode="create" initial={null} />
    </div>
  );
}
