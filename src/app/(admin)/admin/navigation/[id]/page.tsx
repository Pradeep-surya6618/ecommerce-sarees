import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import { NavMenuItemForm } from "@/components/admin/NavMenuItemForm";

export const metadata = { title: "Edit menu item · Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNavMenuItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = await navMenuRepo.getById(id);
  if (!item) notFound();

  const [categories, topLevel] = await Promise.all([
    categoriesRepo.list(),
    navMenuRepo.listTopLevel(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/navigation"
        className="inline-flex w-fit cursor-pointer items-center gap-2 text-xs text-ink-500 transition hover:text-ink-900 sm:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to navigation
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">
          Edit · {item.label}
        </h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">Edit this navigation item.</p>
      </header>
      <NavMenuItemForm
        categories={categories}
        topLevelItems={topLevel}
        editId={item.id}
        defaultItem={item}
      />
    </div>
  );
}
