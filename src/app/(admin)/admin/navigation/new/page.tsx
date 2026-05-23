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
  // No hard redirect here — even when the top-level cap is hit, admins
  // can still add a child under an existing parent. The server action
  // returns an error if they try to submit another top-level item.

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/navigation"
        className="inline-flex w-fit cursor-pointer items-center gap-2 text-xs text-ink-500 transition hover:text-ink-900 sm:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to navigation
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">New menu item</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Add a top-level entry or a child under an existing one.
        </p>
      </header>
      <NavMenuItemForm categories={categories} topLevelItems={topLevel} />
    </div>
  );
}
