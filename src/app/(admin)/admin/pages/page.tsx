import Link from "next/link";
import { EyeOff, Lock, Plus } from "lucide-react";
import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import { Badge } from "@/components/ui/Badge";
import type { ContentPage } from "@/types/domain";

export const metadata = { title: "Pages · Admin" };

const GROUP_LABEL: Record<ContentPage["group"], string> = {
  help: "Help",
  company: "Company",
  none: "Not in footer",
};

const GROUP_TONE: Record<ContentPage["group"], "neutral" | "gold" | "accent"> = {
  help: "gold",
  company: "accent",
  none: "neutral",
};

export default async function AdminPagesIndex() {
  const all = await contentPagesRepo.list();
  const help = all.filter((p) => p.group === "help");
  const company = all.filter((p) => p.group === "company");
  const other = all.filter((p) => p.group === "none");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Pages</h1>
          <p className="text-sm text-ink-700">
            {all.length} pages · markdown-editable content shown in the footer and at{" "}
            <span className="font-mono text-xs">/p/&lt;slug&gt;</span>.
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
        >
          <Plus className="h-4 w-4" /> New page
        </Link>
      </header>

      <Group title="Help" pages={help} />
      <Group title="Company" pages={company} />
      {other.length > 0 && <Group title="Not in footer" pages={other} />}
    </div>
  );
}

function Group({ title, pages }: { title: string; pages: ContentPage[] }) {
  if (pages.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">{title}</h2>
        <p className="rounded-md border border-dashed border-ink-500/20 bg-bg-elevated p-5 text-sm text-ink-500">
          No pages in this group yet.
        </p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">{title}</h2>
      <ul className="flex flex-col gap-2">
        {pages.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-md border border-ink-500/10 bg-bg-elevated px-5 py-3.5"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link
                href={`/admin/pages/${p.id}`}
                className="truncate font-medium text-ink-900 hover:text-accent-primary"
              >
                {p.title}
              </Link>
              <span className="truncate font-mono text-xs text-ink-500">/p/{p.slug}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={GROUP_TONE[p.group]}>{GROUP_LABEL[p.group]}</Badge>
              {p.isSystem && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-ink-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                  <Lock className="h-3 w-3" />
                  System
                </span>
              )}
              {!p.visible && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-ink-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </span>
              )}
              <span className="font-mono text-xs text-ink-500">#{p.sortOrder}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
