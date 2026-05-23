"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, FolderTree, Layers, Link as LinkIcon, ListTree, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { clsx } from "@/lib/utils/clsx";
import {
  createNavMenuItemAction,
  deleteNavMenuItemAction,
  updateNavMenuItemAction,
} from "@/server/actions/admin-nav-menu";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

const KIND_LABEL: Record<NavMenuItemKind, string> = {
  category: "Category",
  "custom-link": "Custom link",
};

function kindFromLabel(label: string): NavMenuItemKind {
  return label === "Custom link" ? "custom-link" : "category";
}

export function NavMenuItemForm({
  categories,
  topLevelItems,
  editId,
  defaultItem,
}: NavMenuItemFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
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

  const kind = watch("kind");
  const visible = watch("visible");

  const parentChoices = topLevelItems.filter((i) => i.id !== editId);
  const parentNames = ["None (top-level)", ...parentChoices.map((p) => p.label)];

  // Category options shown to the user (display label) — children are prefixed.
  const categoryDisplay = categories.map((c) => ({
    slug: c.slug,
    label: c.parentSlug ? `↳ ${c.name}` : c.name,
  }));
  const categoryOptions = categoryDisplay.map((c) => c.label);

  function onSubmit(values: Values) {
    const payload = {
      label: values.label,
      kind: values.kind,
      categorySlug: values.kind === "category" ? (values.categorySlug ?? "") : null,
      href: values.kind === "custom-link" ? (values.href ?? "") : null,
      parentId: values.parentId ? values.parentId : null,
      sortOrder: values.sortOrder,
      visible: values.visible,
    };
    startTransition(async () => {
      try {
        const result = editId
          ? await updateNavMenuItemAction(editId, payload)
          : await createNavMenuItemAction(payload);
        if (!result.ok) {
          toast.error("Couldn't save menu item", { description: result.error });
          return;
        }
        if (editId) {
          toast.success("Menu item saved");
          router.refresh();
        } else {
          toast.success("Menu item created", { description: `"${payload.label}" is now live.` });
          if (result.id) router.push(`/admin/navigation/${result.id}`);
        }
      } catch {
        toast.error("Couldn't save menu item", { description: "Please try again." });
      }
    });
  }

  function confirmDelete() {
    if (!editId) return;
    startDeleting(async () => {
      try {
        const result = await deleteNavMenuItemAction(editId);
        setConfirmOpen(false);
        if (!result.ok) {
          toast.error("Couldn't delete menu item", { description: result.error });
          return;
        }
        toast.success("Menu item deleted", {
          description: `"${defaultItem?.label ?? "Item"}" was removed.`,
        });
        router.push("/admin/navigation");
      } catch {
        setConfirmOpen(false);
        toast.error("Couldn't delete menu item", { description: "Please try again." });
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
        <FormSection title="Basics" hint="What customers see and what it links to.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField label="Label" htmlFor="label" required error={errors.label?.message}>
              <PillInput
                id="label"
                icon={Tag}
                placeholder="Silk Sarees"
                {...register("label")}
                invalid={!!errors.label}
              />
            </PillField>
            <PillField label="Kind" htmlFor="kind" required>
              <Controller
                name="kind"
                control={control}
                render={({ field }) => (
                  <PillListbox
                    id="kind"
                    icon={ListTree}
                    value={KIND_LABEL[field.value]}
                    onChange={(label) => field.onChange(kindFromLabel(label))}
                    onBlur={field.onBlur}
                    options={Object.values(KIND_LABEL)}
                    placeholder="Select kind"
                  />
                )}
              />
            </PillField>
          </div>

          {kind === "category" && (
            <PillField
              label="Category"
              htmlFor="categorySlug"
              required
              hint="Links to /shop/<slug>."
              error={errors.categorySlug?.message}
            >
              <Controller
                name="categorySlug"
                control={control}
                render={({ field }) => {
                  const selected = categoryDisplay.find((c) => c.slug === field.value);
                  return (
                    <PillListbox
                      id="categorySlug"
                      icon={FolderTree}
                      value={selected?.label ?? ""}
                      onChange={(label) => {
                        const match = categoryDisplay.find((c) => c.label === label);
                        field.onChange(match?.slug ?? "");
                      }}
                      onBlur={field.onBlur}
                      options={categoryOptions}
                      placeholder="Select a category"
                      invalid={!!errors.categorySlug}
                    />
                  );
                }}
              />
            </PillField>
          )}

          {kind === "custom-link" && (
            <PillField
              label="URL"
              htmlFor="href"
              required
              hint="Relative (/offers) or absolute (https://…)."
              error={errors.href?.message}
            >
              <PillInput
                id="href"
                icon={LinkIcon}
                placeholder="/offers/buy-1-get-1"
                {...register("href")}
                invalid={!!errors.href}
              />
            </PillField>
          )}
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection
          title="Placement & visibility"
          hint="Hierarchy, order and whether shoppers see it."
        >
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField
              label="Parent"
              htmlFor="parentId"
              hint="Leave as None for a top-level item."
              error={errors.parentId?.message}
            >
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => {
                  const selectedName =
                    field.value && field.value.length > 0
                      ? (parentChoices.find((p) => p.id === field.value)?.label ?? "")
                      : "None (top-level)";
                  return (
                    <PillListbox
                      id="parentId"
                      icon={ListTree}
                      value={selectedName}
                      onChange={(label) => {
                        if (label === "None (top-level)") {
                          field.onChange("");
                          return;
                        }
                        const match = parentChoices.find((p) => p.label === label);
                        field.onChange(match?.id ?? "");
                      }}
                      onBlur={field.onBlur}
                      options={parentNames}
                      placeholder="Select parent"
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

          <label
            htmlFor="visible"
            className={clsx(
              "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4",
              visible ? "border-accent-primary/40 bg-accent-primary/[0.04]" : "border-ink-500/15",
            )}
          >
            <input id="visible" type="checkbox" {...register("visible")} className="sr-only" />
            <span
              className={clsx(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                visible ? "bg-accent-primary text-white" : "bg-ink-900/[0.06] text-accent-primary",
              )}
            >
              <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-ink-900">Visible on storefront</span>
              <span className="text-[11px] text-ink-500 sm:text-xs">
                Show this item in the header menu and mobile drawer.
              </span>
            </span>
            <span
              role="switch"
              aria-checked={visible}
              className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                visible ? "bg-accent-primary" : "bg-ink-500/25",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                  visible ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </span>
          </label>
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
            {deleting ? "Deleting…" : "Delete item"}
          </button>
        ) : (
          <span />
        )}
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          className="self-stretch sm:self-auto"
        >
          {editId ? "Save changes" : "Create item"}
        </PillSubmitButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this menu item?"
        description={`"${defaultItem?.label ?? "Item"}" and any child items under it will be removed from the navigation. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={deleting}
      />
    </form>
  );
}
