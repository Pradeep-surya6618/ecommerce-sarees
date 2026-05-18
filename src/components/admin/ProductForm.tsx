"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { paiseToRupees } from "@/lib/money";
import { createProductAction, updateProductAction } from "@/server/actions/admin-products";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
  priceRupees: z.coerce.number().int("Must be a whole number").nonnegative("Must be 0 or more"),
  mrpRupees: z.coerce.number().int("Must be a whole number").nonnegative("Must be 0 or more"),
  fabric: z.string().min(2, "Fabric must be at least 2 characters"),
  tagsCsv: z.string().optional(),
  occasionCsv: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

type ProductFormValues = z.infer<typeof productSchema>;

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

export function ProductForm({ categories, editId, defaultProduct }: ProductFormProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(defaultProduct?.variants ?? []);
  const [images, setImages] = useState<ProductImage[]>(defaultProduct?.images ?? []);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
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
          // createProductAction redirects to edit page; toast happens before redirect throws
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Couldn't save product.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {/* Basic Info */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Basic information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Name"
            htmlFor="name"
            required
            error={errors.name?.message}
            className="md:col-span-2"
          >
            <Input
              id="name"
              {...register("name")}
              onBlur={handleNameBlur}
              invalid={!!errors.name}
            />
          </FormField>

          <FormField
            label="Slug"
            htmlFor="slug"
            required
            hint="URL-friendly identifier (auto-filled from name)"
            error={errors.slug?.message}
            className="md:col-span-2"
          >
            <Input id="slug" {...register("slug")} invalid={!!errors.slug} />
          </FormField>

          <FormField
            label="Description"
            htmlFor="description"
            required
            error={errors.description?.message}
            className="md:col-span-2"
          >
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              aria-invalid={errors.description ? "true" : undefined}
              className="w-full rounded-sm border border-ink-500/30 bg-bg-elevated px-3 py-2.5 text-base text-ink-900 transition placeholder:text-ink-500 focus:border-accent-primary focus:outline-none aria-[invalid=true]:border-danger"
            />
            {errors.description && (
              <span className="text-xs text-danger" role="alert">
                {errors.description.message}
              </span>
            )}
          </FormField>
        </div>
      </section>

      {/* Pricing & Category */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Pricing &amp; category</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <FormField
            label="Price (₹)"
            htmlFor="priceRupees"
            required
            error={errors.priceRupees?.message}
          >
            <Input
              id="priceRupees"
              type="number"
              min={0}
              {...register("priceRupees")}
              invalid={!!errors.priceRupees}
            />
          </FormField>

          <FormField label="MRP (₹)" htmlFor="mrpRupees" required error={errors.mrpRupees?.message}>
            <Input
              id="mrpRupees"
              type="number"
              min={0}
              {...register("mrpRupees")}
              invalid={!!errors.mrpRupees}
            />
          </FormField>

          <FormField
            label="Category"
            htmlFor="categorySlug"
            required
            error={errors.categorySlug?.message}
          >
            <Select id="categorySlug" {...register("categorySlug")}>
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </section>

      {/* Details */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Details</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Fabric" htmlFor="fabric" required error={errors.fabric?.message}>
            <Input
              id="fabric"
              placeholder="e.g. Pure Silk"
              {...register("fabric")}
              invalid={!!errors.fabric}
            />
          </FormField>

          <FormField
            label="Tags"
            htmlFor="tagsCsv"
            hint="Comma-separated, e.g. bridal, wedding, festive"
            error={errors.tagsCsv?.message}
          >
            <Input id="tagsCsv" placeholder="bridal, festive" {...register("tagsCsv")} />
          </FormField>

          <FormField
            label="Occasion"
            htmlFor="occasionCsv"
            hint="Comma-separated, e.g. Wedding, Party, Casual"
            error={errors.occasionCsv?.message}
          >
            <Input id="occasionCsv" placeholder="Wedding, Party" {...register("occasionCsv")} />
          </FormField>

          <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
            <Select id="status" {...register("status")}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </FormField>

          <div className="flex items-center gap-3 md:col-span-2">
            <input
              id="featured"
              type="checkbox"
              {...register("featured")}
              className="h-4 w-4 rounded border-ink-500/30 accent-accent-primary"
            />
            <label htmlFor="featured" className="text-sm font-medium text-ink-700">
              Featured product (shown in homepage collections)
            </label>
          </div>
        </div>
      </section>

      {/* Variants */}
      <section className="flex flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Variants</h2>
        <p className="text-sm text-ink-500">
          Each variant represents a colour/size combination with its own stock.
        </p>
        <ProductVariantEditor value={variants} onChange={setVariants} />
      </section>

      {/* Images */}
      <section className="flex flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Images</h2>
        <p className="text-sm text-ink-500">
          Enter image URLs. The first image is used as the cover. Real uploads come in a later
          phase.
        </p>
        <ProductImageEditor value={images} onChange={setImages} />
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : editId ? "Save changes" : "Create product"}
        </button>
        {editId && (
          <a href="/admin/products" className="text-sm text-ink-500 transition hover:text-ink-700">
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
