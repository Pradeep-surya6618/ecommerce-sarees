"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createNavMenuItemAction,
  deleteNavMenuItemAction,
  updateNavMenuItemAction,
} from "@/server/actions/admin-nav-menu";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Category, NavMenuItem, NavMenuItemKind } from "@/types/domain";

const schema = z.object({
  label: z.string().min(1, "Required"),
  kind: z.enum(["category", "custom-link"]),
  categorySlug: z.string().optional(),
  href: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0, "Must be 0 or greater"),
  visible: z.boolean().default(true),
});

type Values = z.infer<typeof schema>;

export interface NavMenuItemFormProps {
  categories: Category[];
  topLevelItems: NavMenuItem[];
  editId?: string;
  defaultItem?: NavMenuItem;
}

export function NavMenuItemForm({
  categories,
  topLevelItems,
  editId,
  defaultItem,
}: NavMenuItemFormProps) {
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: {
      label: defaultItem?.label ?? "",
      kind: defaultItem?.kind ?? "category",
      categorySlug: defaultItem?.categorySlug ?? "",
      href: defaultItem?.href ?? "",
      parentId: defaultItem?.parentId ?? "",
      sortOrder: defaultItem?.sortOrder ?? 0,
      visible: defaultItem?.visible ?? true,
    },
  });

  const [kind, setKind] = useState<NavMenuItemKind>(defaultItem?.kind ?? "category");

  // Parent dropdown excludes the item being edited (a node can't be its own parent).
  const parentChoices = topLevelItems.filter((i) => i.id !== editId);

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        const payload = {
          label: values.label,
          kind: values.kind,
          categorySlug: values.kind === "category" ? (values.categorySlug ?? "") : null,
          href: values.kind === "custom-link" ? (values.href ?? "") : null,
          parentId: values.parentId ? values.parentId : null,
          sortOrder: values.sortOrder,
          visible: values.visible,
        };
        if (editId) {
          await updateNavMenuItemAction(editId, payload);
          toast.success("Menu item saved");
        } else {
          await createNavMenuItemAction(payload);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Couldn't save the item.");
      }
    });
  }

  function onDelete() {
    if (!editId) return;
    if (
      !confirm(
        "Delete this menu item? Any child items under it will also be removed from the navigation.",
      )
    )
      return;
    startDeleting(async () => {
      try {
        await deleteNavMenuItemAction(editId);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Couldn't delete.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-md border border-ink-500/10 bg-bg-elevated p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Label" htmlFor="label" required error={errors.label?.message}>
          <Input
            id="label"
            placeholder="e.g. Silk Sarees"
            {...register("label")}
            invalid={!!errors.label}
          />
        </FormField>

        <FormField label="Kind" htmlFor="kind" required>
          <Select
            id="kind"
            {...register("kind", {
              onChange: (e) => setKind(e.target.value as NavMenuItemKind),
            })}
          >
            <option value="category">Category</option>
            <option value="custom-link">Custom link</option>
          </Select>
        </FormField>

        {kind === "category" && (
          <FormField
            label="Category"
            htmlFor="categorySlug"
            required
            hint="Links to /shop/<slug>"
            className="md:col-span-2"
            error={errors.categorySlug?.message}
          >
            <Select id="categorySlug" {...register("categorySlug")}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.parentSlug ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {kind === "custom-link" && (
          <FormField
            label="URL"
            htmlFor="href"
            required
            hint="Any URL — relative (/offers) or absolute (https://…)"
            className="md:col-span-2"
            error={errors.href?.message}
          >
            <Input id="href" placeholder="/offers/buy-1-get-1" {...register("href")} />
          </FormField>
        )}

        <FormField
          label="Parent"
          htmlFor="parentId"
          hint="Leave blank for a top-level item"
          error={errors.parentId?.message}
        >
          <Select id="parentId" {...register("parentId")}>
            <option value="">None (top-level)</option>
            {parentChoices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Sort order"
          htmlFor="sortOrder"
          required
          hint="Lower numbers appear first"
          error={errors.sortOrder?.message}
        >
          <Input
            id="sortOrder"
            type="number"
            min={0}
            {...register("sortOrder", { valueAsNumber: true })}
            invalid={!!errors.sortOrder}
          />
        </FormField>

        <div className="flex items-center gap-3 md:col-span-2">
          <input
            id="visible"
            type="checkbox"
            {...register("visible")}
            className="h-4 w-4 rounded border-ink-500/30 accent-accent-primary"
          />
          <label htmlFor="visible" className="text-sm font-medium text-ink-700">
            Visible on storefront
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : editId ? "Save changes" : "Create item"}
          </button>
          <Link
            href="/admin/navigation"
            className="text-sm text-ink-500 transition hover:text-ink-700"
          >
            Cancel
          </Link>
        </div>
        {editId && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-sm font-medium text-danger transition hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
