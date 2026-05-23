"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  FileText,
  FolderTree,
  ImageIcon,
  Layers,
  Link2,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { clsx } from "@/lib/utils/clsx";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/server/actions/admin-categories";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  allCategories: Category[];
  editId?: string;
  defaultCategory?: Category;
  /** Number of products currently in this category. Used to block deletion when > 0. */
  productCount?: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface PillTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> {
  icon: LucideIcon;
  invalid?: boolean;
  rows?: number;
}

function PillTextarea({ icon: Icon, invalid, rows = 4, className, ...rest }: PillTextareaProps) {
  return (
    <div
      className={clsx(
        "flex gap-2 rounded-3xl border bg-bg-elevated p-2 transition sm:gap-3 sm:p-2.5",
        invalid
          ? "border-danger/60 focus-within:border-danger"
          : "border-ink-500/20 focus-within:border-accent-primary",
      )}
    >
      <span
        className={clsx(
          "pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
          invalid ? "bg-danger/15 text-danger" : "bg-ink-900/[0.06] text-accent-primary",
        )}
      >
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <textarea
        rows={rows}
        aria-invalid={invalid ? "true" : undefined}
        className={clsx(
          "w-full resize-y bg-transparent py-1.5 pr-2 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:py-2 sm:text-base",
          className,
        )}
        {...rest}
      />
    </div>
  );
}

export function CategoryForm({
  allCategories,
  editId,
  defaultCategory,
  productCount = 0,
}: CategoryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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

  const nameValue = watch("name");
  useEffect(() => {
    if (editId) return;
    if (dirtyFields.slug) return;
    setValue("slug", slugify(nameValue ?? ""), { shouldDirty: false });
  }, [nameValue, editId, dirtyFields.slug, setValue]);

  const previewUrl = watch("imageUrl");
  const hasImage = previewUrl && /^https?:\/\//.test(previewUrl);

  function onSubmit(values: Values) {
    startTransition(async () => {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        imageUrl: values.imageUrl,
        parentSlug: values.parentSlug && values.parentSlug.length > 0 ? values.parentSlug : null,
        sortOrder: values.sortOrder,
      };
      try {
        const result = editId
          ? await updateCategoryAction(editId, payload)
          : await createCategoryAction(payload);

        if (!result.ok) {
          toast.error("Couldn't save the category", { description: result.error });
          return;
        }

        if (editId) {
          toast.success("Category saved");
          router.refresh();
        } else {
          toast.success("Category created", { description: `"${values.name}" is now live.` });
          router.push("/admin/categories");
        }
      } catch {
        toast.error("Couldn't save the category", {
          description: "Something went wrong. Please try again.",
        });
      }
    });
  }

  function handleDeleteClick() {
    if (!editId) return;
    if (productCount > 0) {
      setBlockedOpen(true);
      return;
    }
    setConfirmOpen(true);
  }

  function confirmDelete() {
    if (!editId) return;
    startDeleting(async () => {
      try {
        const result = await deleteCategoryAction(editId);
        setConfirmOpen(false);
        if (!result.ok) {
          toast.error("Couldn't delete", { description: result.error });
          return;
        }
        toast.success("Category deleted", {
          description: `"${defaultCategory?.name ?? "Category"}" has been removed.`,
        });
        router.push("/admin/categories");
      } catch {
        setConfirmOpen(false);
        toast.error("Couldn't delete", { description: "Please try again." });
      }
    });
  }

  const parentChoices = allCategories.filter((c) => c.parentSlug === null && c.id !== editId);
  const parentNames = ["None (top-level)", ...parentChoices.map((c) => c.name)];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Basics" hint="What this category is called and where it lives.">
          <PillField label="Name" htmlFor="name" required error={errors.name?.message}>
            <PillInput
              id="name"
              icon={Tag}
              placeholder="Kanjivaram"
              {...register("name")}
              invalid={!!errors.name}
            />
          </PillField>
          <PillField
            label="Slug"
            htmlFor="slug"
            required
            hint="URL path under /shop/ (auto-filled from name)."
            error={errors.slug?.message}
          >
            <PillInput
              id="slug"
              icon={Link2}
              placeholder="kanjivaram"
              {...register("slug")}
              invalid={!!errors.slug}
            />
          </PillField>
          <PillField
            label="Description"
            htmlFor="description"
            required
            error={errors.description?.message}
          >
            <PillTextarea
              id="description"
              icon={FileText}
              rows={4}
              placeholder="A few sentences customers will see at the top of the category page."
              {...register("description")}
              invalid={!!errors.description}
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Cover image" hint="Used on the home page tile grid.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-[200px_1fr]">
            {hasImage ? (
              <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-base shadow-card md:h-44 md:w-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Category preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="md:w-[200px]">
                <ImageUploader
                  folder="categories"
                  variant="dropzone"
                  label="Drop cover here"
                  hint="or click to browse · PNG, JPG, WEBP"
                  onUploaded={(url) =>
                    setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true })
                  }
                />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <PillField
                label="Image URL"
                htmlFor="imageUrl"
                required
                error={errors.imageUrl?.message}
              >
                <PillInput
                  id="imageUrl"
                  icon={ImageIcon}
                  type="url"
                  placeholder="Paste a URL or upload above"
                  {...register("imageUrl")}
                  invalid={!!errors.imageUrl}
                />
              </PillField>
              {hasImage && (
                <ImageUploader
                  folder="categories"
                  label="Replace cover"
                  className="self-start"
                  onUploaded={(url) =>
                    setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true })
                  }
                />
              )}
            </div>
          </div>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Placement" hint="Hierarchy and ordering.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField
              label="Parent category"
              htmlFor="parentSlug"
              hint="Leave as “None” for a top-level category."
              error={errors.parentSlug?.message}
            >
              <Controller
                name="parentSlug"
                control={control}
                render={({ field }) => {
                  const selectedName =
                    field.value && field.value.length > 0
                      ? (parentChoices.find((c) => c.slug === field.value)?.name ?? "")
                      : "None (top-level)";
                  return (
                    <PillListbox
                      id="parentSlug"
                      icon={FolderTree}
                      value={selectedName}
                      onChange={(name) => {
                        if (name === "None (top-level)") {
                          field.onChange("");
                          return;
                        }
                        const match = parentChoices.find((c) => c.name === name);
                        field.onChange(match?.slug ?? "");
                      }}
                      onBlur={field.onBlur}
                      options={parentNames}
                      placeholder="Select parent"
                      invalid={!!errors.parentSlug}
                    />
                  );
                }}
              />
            </PillField>
            <PillField
              label="Sort order"
              htmlFor="sortOrder"
              required
              hint="Lower numbers appear first."
              error={errors.sortOrder?.message}
            >
              <PillInput
                id="sortOrder"
                icon={Layers}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                {...register("sortOrder", { valueAsNumber: true })}
                invalid={!!errors.sortOrder}
              />
            </PillField>
          </div>
        </FormSection>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {editId ? (
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-danger/30 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {deleting ? "Deleting…" : "Delete category"}
          </button>
        ) : (
          <span />
        )}
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          className="self-stretch sm:self-auto"
        >
          {editId ? "Save changes" : "Create category"}
        </PillSubmitButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this category?"
        description={`"${defaultCategory?.name ?? "This category"}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={deleting}
      />

      <ConfirmDialog
        open={blockedOpen}
        onClose={() => setBlockedOpen(false)}
        onConfirm={() => setBlockedOpen(false)}
        title="Can't delete this category"
        description={`This category still has ${productCount} ${productCount === 1 ? "product" : "products"} linked to it. Move or archive them first, then try again.`}
        tone="default"
        icon={AlertCircle}
        mode="info"
      />
    </form>
  );
}
