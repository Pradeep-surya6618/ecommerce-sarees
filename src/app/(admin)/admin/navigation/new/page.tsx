import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import { NavMenuItemForm } from "@/components/admin/NavMenuItemForm";

export const metadata = { title: "New menu item · Admin" };

export default async function NewNavMenuItemPage() {
  const [categories, topLevel] = await Promise.all([
    categoriesRepo.list(),
    navMenuRepo.listTopLevel(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/navigation"
        className="inline-flex w-fit items-center gap-2 text-sm text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to navigation
      </Link>
      <header>
        <h1 className="font-display text-3xl text-ink-900">New menu item</h1>
        <p className="text-sm text-ink-700">
          Add a top-level entry or a child under an existing one.
        </p>
      </header>
      <NavMenuItemForm categories={categories} topLevelItems={topLevel} />
    </div>
  );
}
