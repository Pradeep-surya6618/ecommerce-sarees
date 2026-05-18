"use client";

import Image from "next/image";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/server/actions/admin-categories";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Category } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "Required"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().min(5, "Required"),
  imageUrl: z.string().url("Enter a valid image URL"),
  parentSlug: z.string().optional(),
  sortOrder: z.number().int().min(0, "Must be 0 or greater"),
});

type Values = z.infer<typeof schema>;

export interface CategoryFormProps {
  /** All categories, used to populate the parent select. The current category (if editing) is excluded. */
  allCategories: Category[];
  editId?: string;
  defaultCategory?: Category;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({ allCategories, editId, defaultCategory }: CategoryFormProps) {
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultCategory?.name ?? "",
      slug: defaultCategory?.slug ?? "",
      description: defaultCategory?.description ?? "",
      imageUrl: defaultCategory?.imageUrl ?? "",
      parentSlug: defaultCategory?.parentSlug ?? "",
      sortOrder: defaultCategory?.sortOrder ?? 0,
    },
  });

  // Auto-slugify from name only when slug hasn't been edited manually and we're creating.
  const nameValue = watch("name");
  useEffect(() => {
    if (editId) return;
    if (dirtyFields.slug) return;
    setValue("slug", slugify(nameValue ?? ""), { shouldDirty: false });
  }, [nameValue, editId, dirtyFields.slug, setValue]);

  const previewUrl = watch("imageUrl");

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        const payload = {
          name: values.name,
          slug: values.slug,
          description: values.description,
          imageUrl: values.imageUrl,
          parentSlug: values.parentSlug && values.parentSlug.length > 0 ? values.parentSlug : null,
          sortOrder: values.sortOrder,
        };
        if (editId) {
          await updateCategoryAction(editId, payload);
          toast.success("Category saved");
        } else {
          await createCategoryAction(payload);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Couldn't save the category.");
      }
    });
  }

  function onDelete() {
    if (!editId) return;
    if (!confirm("Delete this category? Products in this category will be orphaned.")) return;
    startDeleting(async () => {
      try {
        await deleteCategoryAction(editId);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Couldn't delete.");
      }
    });
  }

  // Top-level categories minus the current one (a category can't be its own parent).
  const parentChoices = allCategories.filter((c) => c.parentSlug === null && c.id !== editId);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-md border border-ink-500/10 bg-bg-elevated p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register("name")} invalid={!!errors.name} />
        </FormField>
        <FormField
          label="Slug"
          htmlFor="slug"
          required
          hint="URL path under /shop/"
          error={errors.slug?.message}
        >
          <Input id="slug" {...register("slug")} invalid={!!errors.slug} />
        </FormField>
        <FormField
          label="Description"
          htmlFor="description"
          required
          className="md:col-span-2"
          error={errors.description?.message}
        >
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className="w-full rounded-sm border border-ink-500/30 bg-bg-base p-3 text-sm text-ink-900 transition focus:border-accent-primary focus:outline-none"
          />
        </FormField>
        <FormField
          label="Image URL"
          htmlFor="imageUrl"
          required
          className="md:col-span-2"
          error={errors.imageUrl?.message}
        >
          <Input id="imageUrl" type="url" {...register("imageUrl")} invalid={!!errors.imageUrl} />
        </FormField>
        <FormField
          label="Parent category (optional)"
          htmlFor="parentSlug"
          hint="Leave blank for a top-level category"
          error={errors.parentSlug?.message}
        >
          <Select id="parentSlug" {...register("parentSlug")}>
            <option value="">None (top-level)</option>
            {parentChoices.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Sort order"
          htmlFor="sortOrder"
          required
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
      </div>

      {previewUrl && /^https?:\/\//.test(previewUrl) && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-700">Preview</span>
          <div className="relative h-48 w-72 overflow-hidden rounded-md border border-ink-500/10 bg-ink-500/5">
            <Image
              src={previewUrl}
              alt="Category preview"
              fill
              sizes="288px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : editId ? "Save changes" : "Create category"}
        </button>
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
