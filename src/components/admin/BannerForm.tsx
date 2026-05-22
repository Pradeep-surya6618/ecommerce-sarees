"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  ImageIcon,
  Layers,
  Layout,
  Link as LinkIcon,
  MousePointerClick,
  Sparkles,
  Tag,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BANNER_LIMITS } from "@/lib/admin/banner-limits";
import { clsx } from "@/lib/utils/clsx";
import {
  createBannerAction,
  deleteBannerAction,
  updateBannerAction,
} from "@/server/actions/admin-banners";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  /** Current banner count per placement, used to filter out full placements
   *  from the listbox. The banner being edited is allowed to keep its own
   *  placement even if at limit. */
  placementCounts?: Record<Banner["placement"], number>;
}

const PLACEMENT_LABELS: Record<Banner["placement"], string> = {
  "home-hero": "Home hero",
  "home-strip": "Home strip",
  "shop-strip": "Shop strip",
};

function placementFromLabel(label: string): Banner["placement"] {
  const entry = Object.entries(PLACEMENT_LABELS).find(([, l]) => l === label);
  return (entry?.[0] as Banner["placement"]) ?? "home-hero";
}

export function BannerForm({ editId, defaultBanner, placementCounts }: BannerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
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
  const imageAlt = watch("imageAlt");
  const active = watch("active");
  const hasImage = Boolean(imageUrl && /^https?:\/\//.test(imageUrl));

  /** Placements available in the listbox. A placement is included when:
   *  - placementCounts wasn't provided (legacy callers), OR
   *  - it has room (count < limit), OR
   *  - it's the placement of the banner currently being edited (so the user
   *    doesn't accidentally lose their slot by opening edit on a full one). */
  const availablePlacements: Banner["placement"][] = (
    Object.keys(PLACEMENT_LABELS) as Banner["placement"][]
  ).filter((p) => {
    if (!placementCounts) return true;
    if (defaultBanner?.placement === p) return true;
    return placementCounts[p] < BANNER_LIMITS[p];
  });

  const placementOptions = availablePlacements.map((p) => PLACEMENT_LABELS[p]);

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
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Could not save banner.");
      }
    });
  }

  function confirmDelete() {
    if (!editId) return;
    startDeleting(async () => {
      try {
        await deleteBannerAction(editId);
        toast.success("Banner deleted", {
          description: `"${defaultBanner?.title ?? "Banner"}" has been removed.`,
        });
        setConfirmOpen(false);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setConfirmOpen(false);
        toast.error(err instanceof Error ? err.message : "Could not delete banner.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Placement & status" hint="Where the banner appears.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField
              label="Placement"
              htmlFor="placement"
              required
              error={errors.placement?.message}
            >
              <Controller
                name="placement"
                control={control}
                render={({ field }) => (
                  <PillListbox
                    id="placement"
                    icon={Layout}
                    value={PLACEMENT_LABELS[field.value]}
                    onChange={(label) => field.onChange(placementFromLabel(label))}
                    onBlur={field.onBlur}
                    options={placementOptions}
                    placeholder="Select placement"
                    invalid={!!errors.placement}
                  />
                )}
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
                step={1}
                inputMode="numeric"
                placeholder="0"
                {...register("sortOrder", { valueAsNumber: true })}
                invalid={!!errors.sortOrder}
              />
            </PillField>
          </div>

          <label
            htmlFor="active"
            className={clsx(
              "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4",
              active ? "border-accent-primary/40 bg-accent-primary/[0.04]" : "border-ink-500/15",
            )}
          >
            <input id="active" type="checkbox" {...register("active")} className="sr-only" />
            <span
              className={clsx(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                active ? "bg-accent-primary text-white" : "bg-ink-900/[0.06] text-accent-primary",
              )}
            >
              <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-ink-900">Active</span>
              <span className="text-[11px] text-ink-500 sm:text-xs">
                Visible to shoppers on the storefront.
              </span>
            </span>
            <span
              role="switch"
              aria-checked={active}
              className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                active ? "bg-accent-primary" : "bg-ink-500/25",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                  active ? "translate-x-5" : "translate-x-0.5",
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
        <FormSection
          title="Image"
          hint="Recommended: 2400 × 1200 px (2:1) · max 10 MB. The hero stretches edge-to-edge with object-cover, so center your subject — mobile screens crop to a portrait of the middle."
        >
          <div className="grid gap-3 sm:gap-4 md:grid-cols-[260px_1fr]">
            {hasImage ? (
              <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-base shadow-card md:h-44 md:w-[260px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={imageAlt || "Banner preview"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="md:w-[260px]">
                <ImageUploader
                  folder="banners"
                  variant="dropzone"
                  label="Drop banner image"
                  hint="2400 × 1200 px · PNG, JPG, WEBP · up to 10 MB"
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
              <PillField
                label="Alt text"
                htmlFor="imageAlt"
                required
                hint="Describe the image for accessibility."
                error={errors.imageAlt?.message}
              >
                <PillInput
                  id="imageAlt"
                  icon={Sparkles}
                  placeholder="Woman wearing a red Banarasi saree"
                  {...register("imageAlt")}
                  invalid={!!errors.imageAlt}
                />
              </PillField>
              {hasImage && (
                <ImageUploader
                  folder="banners"
                  label="Replace image"
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
        <FormSection title="Content" hint="Headline, supporting copy and CTA.">
          <PillField label="Title" htmlFor="title" required error={errors.title?.message}>
            <PillInput
              id="title"
              icon={Type}
              placeholder="Summer Sale — Up to 40% Off"
              {...register("title")}
              invalid={!!errors.title}
            />
          </PillField>
          <PillField
            label="Subtitle"
            htmlFor="subtitle"
            hint="Optional supporting text."
            error={errors.subtitle?.message}
          >
            <PillInput
              id="subtitle"
              icon={Tag}
              placeholder="Shop the finest handwoven collection"
              {...register("subtitle")}
            />
          </PillField>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField
              label="CTA label"
              htmlFor="ctaLabel"
              required
              error={errors.ctaLabel?.message}
            >
              <PillInput
                id="ctaLabel"
                icon={MousePointerClick}
                placeholder="Shop now"
                {...register("ctaLabel")}
                invalid={!!errors.ctaLabel}
              />
            </PillField>
            <PillField label="CTA URL" htmlFor="ctaHref" required error={errors.ctaHref?.message}>
              <PillInput
                id="ctaHref"
                icon={LinkIcon}
                placeholder="/shop?sale=1"
                {...register("ctaHref")}
                invalid={!!errors.ctaHref}
              />
            </PillField>
          </div>
        </FormSection>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {editId ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || isPending}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-danger/30 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {deleting ? "Deleting…" : "Delete banner"}
          </button>
        ) : (
          <span />
        )}
        <PillSubmitButton
          pending={isPending}
          pendingLabel="Saving…"
          className="self-stretch sm:self-auto"
        >
          {editId ? "Save changes" : "Create banner"}
        </PillSubmitButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this banner?"
        description={`"${defaultBanner?.title ?? "Banner"}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={deleting}
      />
    </form>
  );
}
