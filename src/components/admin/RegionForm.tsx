"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Layers, Link2, MapPin, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  createRegionAction,
  deleteRegionAction,
  updateRegionAction,
} from "@/server/actions/admin-regions";
import {
  FormSection,
  PillField,
  PillInput,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Region } from "@/types/domain";

const schema = z.object({
  state: z.string().min(1, "Required"),
  craft: z.string().min(1, "Required"),
  href: z.string().min(1, "Required"),
  imageUrl: z.string().min(1, "Upload or paste an image URL"),
  sortOrder: z.number().int().min(0, "Must be 0 or greater"),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export interface RegionFormProps {
  editId?: string;
  defaultRegion?: Region;
}

export function RegionForm({ editId, defaultRegion }: RegionFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      state: defaultRegion?.state ?? "",
      craft: defaultRegion?.craft ?? "",
      href: defaultRegion?.href ?? "",
      imageUrl: defaultRegion?.imageUrl ?? "",
      sortOrder: defaultRegion?.sortOrder ?? 0,
      active: defaultRegion?.active ?? true,
    },
  });

  const imageUrl = watch("imageUrl");
  const active = watch("active");
  const hasImage = imageUrl && /^https?:\/\//.test(imageUrl);

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        const result = editId
          ? await updateRegionAction(editId, values)
          : await createRegionAction(values);
        if (!result.ok) {
          toast.error("Couldn't save region", { description: result.error });
          return;
        }
        if (editId) {
          toast.success("Region saved");
          router.push("/admin/regions");
        } else {
          toast.success("Region created", {
            description: `${values.state} · ${values.craft} is now live.`,
          });
          router.push("/admin/regions");
        }
      } catch {
        toast.error("Couldn't save region", { description: "Please try again." });
      }
    });
  }

  function confirmDelete() {
    if (!editId) return;
    startDeleting(async () => {
      try {
        const result = await deleteRegionAction(editId);
        setConfirmOpen(false);
        if (!result.ok) {
          toast.error("Couldn't delete region", { description: result.error });
          return;
        }
        toast.success("Region deleted", {
          description: `${defaultRegion?.state ?? "Region"} has been removed.`,
        });
        router.push("/admin/regions");
      } catch {
        setConfirmOpen(false);
        toast.error("Couldn't delete region", { description: "Please try again." });
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
        <FormSection title="Region" hint="Where the craft is from and what it's known for.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField label="State" htmlFor="state" required error={errors.state?.message}>
              <PillInput
                id="state"
                icon={MapPin}
                placeholder="Tamil Nadu"
                {...register("state")}
                invalid={!!errors.state}
              />
            </PillField>
            <PillField label="Craft" htmlFor="craft" required error={errors.craft?.message}>
              <PillInput
                id="craft"
                icon={Sparkles}
                placeholder="Kanjivaram silks"
                {...register("craft")}
                invalid={!!errors.craft}
              />
            </PillField>
          </div>
          <PillField
            label="Link target"
            htmlFor="href"
            required
            hint="e.g. /shop/kanjivaram or /shop?fabric=paithani"
            error={errors.href?.message}
          >
            <PillInput
              id="href"
              icon={Link2}
              placeholder="/shop/kanjivaram"
              {...register("href")}
              invalid={!!errors.href}
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection
          title="Cover image"
          hint="After you pick a file, a crop window opens so you can fit the region tile frame (4:3). Used on the home page “Crafts by region” section."
        >
          <div className="grid gap-3 sm:gap-4 md:grid-cols-[220px_1fr]">
            {hasImage ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-base shadow-card md:w-[220px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Region preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="md:w-[220px]">
                <ImageUploader
                  folder="regions"
                  variant="dropzone"
                  label="Drop cover here"
                  hint="Crop to 4:3 in the next step · PNG, JPG, WEBP"
                  aspectRatio={4 / 3}
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
                  placeholder="Upload or paste a URL"
                  {...register("imageUrl")}
                  invalid={!!errors.imageUrl}
                />
              </PillField>
              {hasImage && (
                <ImageUploader
                  folder="regions"
                  label="Replace cover"
                  className="self-start"
                  aspectRatio={4 / 3}
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
        <FormSection title="Display" hint="Ordering and visibility.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
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
            <label
              htmlFor="active"
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4 ${
                active ? "border-accent-primary/40 bg-accent-primary/[0.04]" : "border-ink-500/15"
              }`}
            >
              <input id="active" type="checkbox" {...register("active")} className="sr-only" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-ink-900">Active</span>
                <span className="text-[11px] text-ink-500 sm:text-xs">
                  Visible on the home page.
                </span>
              </span>
              <span
                role="switch"
                aria-checked={active}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  active ? "bg-accent-primary" : "bg-ink-500/25"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </label>
          </div>
        </FormSection>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {editId ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || pending}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-danger/30 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {deleting ? "Deleting…" : "Delete region"}
          </button>
        ) : (
          <span />
        )}
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          className="self-stretch sm:self-auto"
        >
          {editId ? "Save changes" : "Create region"}
        </PillSubmitButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this region?"
        description={`${defaultRegion?.state ?? "Region"} · ${defaultRegion?.craft ?? ""} will be permanently removed.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={deleting}
      />
    </form>
  );
}
