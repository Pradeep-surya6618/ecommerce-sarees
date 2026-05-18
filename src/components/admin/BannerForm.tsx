"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createBannerAction,
  deleteBannerAction,
  updateBannerAction,
} from "@/server/actions/admin-banners";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Banner } from "@/types/domain";

const bannerSchema = z.object({
  placement: z.enum(["home-hero", "home-strip", "shop-strip"]),
  imageUrl: z.string().min(1, "Image URL is required"),
  imageAlt: z.string().min(1, "Image alt text is required"),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  ctaLabel: z.string().min(1, "CTA label is required"),
  ctaHref: z.string().min(1, "CTA URL is required"),
  sortOrder: z.number().int("Must be a whole number"),
  active: z.boolean(),
});

type BannerFormValues = z.output<typeof bannerSchema>;

export interface BannerFormProps {
  editId?: string;
  defaultBanner?: Banner;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function BannerForm({ editId, defaultBanner }: BannerFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      placement: defaultBanner?.placement ?? "home-hero",
      imageUrl: defaultBanner?.imageUrl ?? "",
      imageAlt: defaultBanner?.imageAlt ?? "",
      title: defaultBanner?.title ?? "",
      subtitle: defaultBanner?.subtitle ?? "",
      ctaLabel: defaultBanner?.ctaLabel ?? "",
      ctaHref: defaultBanner?.ctaHref ?? "",
      sortOrder: defaultBanner?.sortOrder ?? 0,
      active: defaultBanner?.active ?? true,
    },
  });

  const imageUrl = watch("imageUrl");
  const showPreview = isValidHttpUrl(imageUrl);

  async function onSubmit(values: BannerFormValues) {
    const input = {
      placement: values.placement,
      imageUrl: values.imageUrl,
      imageAlt: values.imageAlt,
      title: values.title,
      subtitle: values.subtitle || undefined,
      ctaLabel: values.ctaLabel,
      ctaHref: values.ctaHref,
      sortOrder: values.sortOrder,
      active: values.active,
    };

    startTransition(async () => {
      try {
        if (editId) {
          await updateBannerAction(editId, input);
          toast.success("Banner saved");
        } else {
          await createBannerAction(input);
          // createBannerAction redirects; toast fires before NEXT_REDIRECT throws
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Could not save banner.");
      }
    });
  }

  function handleDelete() {
    if (!editId) return;
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteBannerAction(editId);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Could not delete banner.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {/* Placement & Status */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Placement &amp; status</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <FormField
            label="Placement"
            htmlFor="placement"
            required
            error={errors.placement?.message}
          >
            <Select id="placement" {...register("placement")}>
              <option value="home-hero">Home hero</option>
              <option value="home-strip">Home strip</option>
              <option value="shop-strip">Shop strip</option>
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
              step="1"
              {...register("sortOrder", { valueAsNumber: true })}
              invalid={!!errors.sortOrder}
            />
          </FormField>

          <div className="flex flex-col gap-1.5 justify-end pb-1">
            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                {...register("active")}
                className="h-4 w-4 rounded border-ink-500/30 accent-accent-primary"
              />
              <label htmlFor="active" className="text-sm font-medium text-ink-700">
                Active (visible to shoppers)
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Image */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Image</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Image URL"
            htmlFor="imageUrl"
            required
            error={errors.imageUrl?.message}
            className="md:col-span-2"
          >
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register("imageUrl")}
              invalid={!!errors.imageUrl}
            />
          </FormField>

          <FormField
            label="Image alt text"
            htmlFor="imageAlt"
            required
            hint="Describe the image for accessibility"
            error={errors.imageAlt?.message}
            className="md:col-span-2"
          >
            <Input
              id="imageAlt"
              placeholder="e.g. Woman wearing a red Banarasi saree"
              {...register("imageAlt")}
              invalid={!!errors.imageAlt}
            />
          </FormField>
        </div>

        {showPreview && (
          <div className="mt-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Preview</p>
            <div className="relative h-48 w-full overflow-hidden rounded-md border border-ink-500/10 bg-ink-500/5">
              <Image
                src={imageUrl}
                alt={watch("imageAlt") || "Banner preview"}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Content</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Title"
            htmlFor="title"
            required
            error={errors.title?.message}
            className="md:col-span-2"
          >
            <Input
              id="title"
              placeholder="e.g. Summer Sale — Up to 40% Off"
              {...register("title")}
              invalid={!!errors.title}
            />
          </FormField>

          <FormField
            label="Subtitle"
            htmlFor="subtitle"
            hint="Optional supporting text"
            error={errors.subtitle?.message}
            className="md:col-span-2"
          >
            <Input
              id="subtitle"
              placeholder="e.g. Shop the finest handwoven collection"
              {...register("subtitle")}
            />
          </FormField>

          <FormField label="CTA label" htmlFor="ctaLabel" required error={errors.ctaLabel?.message}>
            <Input
              id="ctaLabel"
              placeholder="e.g. Shop now"
              {...register("ctaLabel")}
              invalid={!!errors.ctaLabel}
            />
          </FormField>

          <FormField label="CTA URL" htmlFor="ctaHref" required error={errors.ctaHref?.message}>
            <Input
              id="ctaHref"
              placeholder="e.g. /shop?sale=1"
              {...register("ctaHref")}
              invalid={!!errors.ctaHref}
            />
          </FormField>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : editId ? "Save changes" : "Create banner"}
        </button>
      </div>

      {editId && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-5">
          <h3 className="mb-1 font-display text-base text-ink-900">Danger zone</h3>
          <p className="mb-3 text-sm text-ink-500">
            Deleting a banner is permanent and cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-sm border border-danger px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
          >
            Delete banner
          </button>
        </div>
      )}
    </form>
  );
}
