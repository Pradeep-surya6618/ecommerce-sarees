import Link from "next/link";
import { ChevronRight, EyeOff, Plus } from "lucide-react";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import { Badge } from "@/components/ui/Badge";
import type { NavMenuItem } from "@/types/domain";

export const metadata = { title: "Navigation · Admin" };

function resolveHref(item: NavMenuItem): string {
  if (item.kind === "category" && item.categorySlug) return `/shop/${item.categorySlug}`;
  return item.href ?? "—";
}

export default async function AdminNavigationPage() {
  const tree = await navMenuRepo.listTree(false);
  const allCount = (await navMenuRepo.list()).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Navigation</h1>
          <p className="text-sm text-ink-700">
            {allCount} items · controls the storefront header menu and mobile drawer.
          </p>
        </div>
        <Link
          href="/admin/navigation/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
        >
          <Plus className="h-4 w-4" /> New item
        </Link>
      </header>

      {tree.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-500/20 bg-bg-elevated p-8 text-center text-sm text-ink-500">
          No menu items yet. Add one to populate the storefront header.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tree.map(({ item, children }) => (
            <section key={item.id} className="rounded-md border border-ink-500/10 bg-bg-elevated">
              <Row item={item} indent={0} />
              {children.length > 0 && (
                <ul className="border-t border-ink-500/10">
                  {children.map((child) => (
                    <li key={child.id} className="border-b border-ink-500/10 last:border-b-0">
                      <Row item={child} indent={1} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-500">
        Items are shown in <strong>sort order</strong>. Lower numbers appear first. Top-level items
        appear in the header bar; child items appear in the dropdown panel under their parent.
      </p>
    </div>
  );
}

function Row({ item, indent }: { item: NavMenuItem; indent: number }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-5 py-3.5"
      style={{ paddingLeft: 20 + indent * 24 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {indent > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-500" />}
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/admin/navigation/${item.id}`}
            className="truncate font-medium text-ink-900 hover:text-accent-primary"
          >
            {item.label}
          </Link>
          <span className="truncate font-mono text-xs text-ink-500">{resolveHref(item)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={item.kind === "category" ? "neutral" : "gold"}>
          {item.kind === "category" ? "Category" : "Custom"}
        </Badge>
        {!item.visible && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-ink-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
            <EyeOff className="h-3 w-3" />
            Hidden
          </span>
        )}
        <span className="font-mono text-xs text-ink-500">#{item.sortOrder}</span>
      </div>
    </div>
  );
}
