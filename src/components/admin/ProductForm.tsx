"use client";

import Link from "next/link";
import { forwardRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  FolderTree,
  Hash,
  IndianRupee,
  Link2,
  PartyPopper,
  Sparkles,
  Star,
  Tag,
  ToggleRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { paiseToRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { createProductAction, updateProductAction } from "@/server/actions/admin-products";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import type { Category, Product, ProductDraft, ProductImage, ProductVariant } from "@/types/domain";
import { ProductImageEditor } from "./ProductImageEditor";
import { ProductVariantEditor } from "./ProductVariantEditor";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categorySlug: z.string().min(1, "Select a category"),
  priceRupees: z.number().int("Must be a whole number").nonnegative("Must be 0 or more"),
  mrpRupees: z.number().int("Must be a whole number").nonnegative("Must be 0 or more"),
  fabric: z.string().min(2, "Fabric must be at least 2 characters"),
  tagsCsv: z.string().optional(),
  occasionCsv: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

type ProductFormValues = z.output<typeof productSchema>;

export interface ProductFormProps {
  categories: Category[];
  editId?: string;
  defaultProduct?: Product;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface PillTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> {
  icon: LucideIcon;
  invalid?: boolean;
  rows?: number;
}

const PillTextarea = forwardRef<HTMLTextAreaElement, PillTextareaProps>(function PillTextarea(
  { icon: Icon, invalid, rows = 4, className, ...rest },
  ref,
) {
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
        ref={ref}
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
});

export function ProductForm({ categories, editId, defaultProduct }: ProductFormProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(defaultProduct?.variants ?? []);
  const [images, setImages] = useState<ProductImage[]>(defaultProduct?.images ?? []);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultProduct?.name ?? "",
      slug: defaultProduct?.slug ?? "",
      description: defaultProduct?.description ?? "",
      categorySlug: defaultProduct?.categorySlug ?? "",
      priceRupees: defaultProduct ? paiseToRupees(defaultProduct.priceInPaise) : 0,
      mrpRupees: defaultProduct ? paiseToRupees(defaultProduct.mrpInPaise) : 0,
      fabric: defaultProduct?.fabric ?? "",
      tagsCsv: defaultProduct?.tags.join(", ") ?? "",
      occasionCsv: defaultProduct?.occasion.join(", ") ?? "",
      featured: defaultProduct?.featured ?? false,
      status: defaultProduct?.status ?? "draft",
    },
  });

  const featured = watch("featured");
  const nameValue = watch("name");

  function handleNameBlur() {
    const currentSlug = watch("slug");
    if (!currentSlug && nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }

  async function onSubmit(values: ProductFormValues) {
    const draft: ProductDraft = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      categorySlug: values.categorySlug,
      priceInPaise: values.priceRupees * 100,
      mrpInPaise: values.mrpRupees * 100,
      fabric: values.fabric,
      tags: (values.tagsCsv ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      occasion: (values.occasionCsv ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      featured: values.featured,
      status: values.status,
      variants,
      images,
    };

    startTransition(async () => {
      try {
        if (editId) {
          await updateProductAction(editId, draft);
          toast.success("Product saved");
        } else {
          await createProductAction(draft);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Couldn't save product.");
      }
    });
  }

  const categoryNames = categories.map((c) => c.name);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Basic info" hint="What customers see first.">
          <PillField label="Name" htmlFor="name" required error={errors.name?.message}>
            <PillInput
              id="name"
              icon={Tag}
              placeholder="Amrita Kanjivaram"
              {...register("name")}
              onBlur={handleNameBlur}
              invalid={!!errors.name}
            />
          </PillField>

          <PillField
            label="Slug"
            htmlFor="slug"
            required
            hint="URL-friendly identifier (auto-filled from name)."
            error={errors.slug?.message}
          >
            <PillInput
              id="slug"
              icon={Link2}
              placeholder="amrita-kanjivaram"
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
              rows={5}
              placeholder="A few sentences about the saree, its weave, palette and the moment it's made for…"
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
        <FormSection title="Pricing & category" hint="How it's priced and where it lives.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField
              label="Price (₹)"
              htmlFor="priceRupees"
              required
              error={errors.priceRupees?.message}
            >
              <PillInput
                id="priceRupees"
                icon={IndianRupee}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="32000"
                {...register("priceRupees", { valueAsNumber: true })}
                invalid={!!errors.priceRupees}
              />
            </PillField>
            <PillField
              label="MRP (₹)"
              htmlFor="mrpRupees"
              required
              error={errors.mrpRupees?.message}
            >
              <PillInput
                id="mrpRupees"
                icon={IndianRupee}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="38000"
                {...register("mrpRupees", { valueAsNumber: true })}
                invalid={!!errors.mrpRupees}
              />
            </PillField>
          </div>
          <PillField
            label="Category"
            htmlFor="categorySlug"
            required
            error={errors.categorySlug?.message}
          >
            <Controller
              name="categorySlug"
              control={control}
              render={({ field }) => {
                const selectedName = categories.find((c) => c.slug === field.value)?.name ?? "";
                return (
                  <PillListbox
                    id="categorySlug"
                    icon={FolderTree}
                    value={selectedName}
                    onChange={(name) => {
                      const cat = categories.find((c) => c.name === name);
                      field.onChange(cat?.slug ?? "");
                    }}
                    onBlur={field.onBlur}
                    options={categoryNames}
                    placeholder="Select a category"
                    invalid={!!errors.categorySlug}
                  />
                );
              }}
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Details" hint="Tags, occasion, and visibility.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField label="Fabric" htmlFor="fabric" required error={errors.fabric?.message}>
              <PillInput
                id="fabric"
                icon={Sparkles}
                placeholder="Pure Silk"
                {...register("fabric")}
                invalid={!!errors.fabric}
              />
            </PillField>
            <PillField
              label="Tags"
              htmlFor="tagsCsv"
              hint="Comma-separated."
              error={errors.tagsCsv?.message}
            >
              <PillInput
                id="tagsCsv"
                icon={Hash}
                placeholder="bridal, festive"
                {...register("tagsCsv")}
              />
            </PillField>
            <PillField
              label="Occasion"
              htmlFor="occasionCsv"
              hint="Comma-separated."
              error={errors.occasionCsv?.message}
            >
              <PillInput
                id="occasionCsv"
                icon={PartyPopper}
                placeholder="Wedding, Party"
                {...register("occasionCsv")}
              />
            </PillField>
            <PillField label="Status" htmlFor="status" required error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <PillListbox
                    id="status"
                    icon={ToggleRight}
                    value={
                      field.value === "active"
                        ? "Active"
                        : field.value === "archived"
                          ? "Archived"
                          : "Draft"
                    }
                    onChange={(label) =>
                      field.onChange(
                        label === "Active" ? "active" : label === "Archived" ? "archived" : "draft",
                      )
                    }
                    onBlur={field.onBlur}
                    options={["Draft", "Active", "Archived"]}
                    placeholder="Select status"
                    invalid={!!errors.status}
                  />
                )}
              />
            </PillField>
          </div>

          <label
            htmlFor="featured"
            className={clsx(
              "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4",
              featured ? "border-accent-primary/40 bg-accent-primary/[0.04]" : "border-ink-500/15",
            )}
          >
            <input id="featured" type="checkbox" {...register("featured")} className="sr-only" />
            <span
              className={clsx(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                featured ? "bg-accent-primary text-white" : "bg-ink-900/[0.06] text-accent-primary",
              )}
            >
              <Star className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-ink-900">Featured product</span>
              <span className="text-[11px] text-ink-500 sm:text-xs">
                Show in homepage collections.
              </span>
            </span>
            <span
              role="switch"
              aria-checked={featured}
              className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                featured ? "bg-accent-primary" : "bg-ink-500/25",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                  featured ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </span>
          </label>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Variants" hint="Each variant is a colour/size with its own stock.">
          <ProductVariantEditor value={variants} onChange={setVariants} />
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Images" hint="The first image is used as the cover.">
          <ProductImageEditor value={images} onChange={setImages} />
        </FormSection>
      </section>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {editId && (
          <Link
            href="/admin/products"
            className="cursor-pointer text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500 transition hover:text-ink-900 sm:text-xs sm:tracking-[0.2em] md:text-sm"
          >
            Cancel
          </Link>
        )}
        <PillSubmitButton pending={isPending} pendingLabel="Saving…">
          {editId ? "Save changes" : "Create product"}
        </PillSubmitButton>
      </div>
    </form>
  );
}
