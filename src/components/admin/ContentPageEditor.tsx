"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, FolderTree, Heading, Layers, Link2, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import {
  createContentPageAction,
  deleteContentPageAction,
  updateContentPageAction,
} from "@/server/actions/admin-content-pages";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ContentPage, ContentPageGroup, ContentPageInput } from "@/types/domain";

export interface ContentPageEditorProps {
  mode: "create" | "edit";
  initial: ContentPage | null;
}

const DEFAULT_FORM: ContentPageInput = {
  slug: "",
  title: "",
  body: "",
  footerLabel: "",
  group: "help",
  sortOrder: 0,
  visible: true,
  externalHref: null,
};

const GROUP_LABEL: Record<ContentPageGroup, string> = {
  help: "Help",
  company: "Company",
  none: "None (not in footer)",
};

function groupFromLabel(label: string): ContentPageGroup {
  if (label === "Company") return "company";
  if (label === "None (not in footer)") return "none";
  return "help";
}

function toInput(p: ContentPage): ContentPageInput {
  return {
    slug: p.slug,
    title: p.title,
    body: p.body,
    footerLabel: p.footerLabel,
    group: p.group,
    sortOrder: p.sortOrder,
    visible: p.visible,
    externalHref: p.externalHref,
  };
}

export function ContentPageEditor({ mode, initial }: ContentPageEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<ContentPageInput>(initial ? toInput(initial) : DEFAULT_FORM);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function update<K extends keyof ContentPageInput>(key: K, value: ContentPageInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createContentPageAction(form)
            : initial
              ? await updateContentPageAction(initial.id, form)
              : null;

        if (!result) return;
        if (!result.ok) {
          toast.error("Couldn't save page", { description: result.error });
          return;
        }

        if (mode === "create") {
          toast.success("Page created", {
            description: `"${form.title}" is now live at /p/${result.page.slug}.`,
          });
        } else {
          toast.success("Page updated");
        }
        router.push("/admin/pages");
      } catch {
        toast.error("Couldn't save page", { description: "Please try again." });
      }
    });
  }

  function confirmDelete() {
    if (!initial) return;
    startDelete(async () => {
      try {
        const result = await deleteContentPageAction(initial.id);
        setConfirmOpen(false);
        if (!result.ok) {
          toast.error("Couldn't delete page", { description: result.error });
          return;
        }
        toast.success("Page deleted", {
          description: `"${initial.title}" was removed.`,
        });
        router.push("/admin/pages");
      } catch {
        setConfirmOpen(false);
        toast.error("Couldn't delete page", { description: "Please try again." });
      }
    });
  }

  const isSystem = initial?.isSystem ?? false;
  const hasExternalHref = !!form.externalHref?.trim();
  const publicUrl = hasExternalHref
    ? form.externalHref
    : form.slug.trim()
      ? `/p/${form.slug.trim()}`
      : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Page details" hint="What customers see and the URL it lives at.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField label="Title" htmlFor="title" required hint="Shown as the page heading.">
              <PillInput
                id="title"
                icon={Heading}
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Returns Policy"
              />
            </PillField>
            <PillField
              label="Slug"
              htmlFor="slug"
              required
              hint={
                isSystem
                  ? "System pages have a fixed slug — wired to the storefront route."
                  : "Lowercase letters, numbers, hyphens. Used in the URL."
              }
            >
              <PillInput
                id="slug"
                icon={Link2}
                required
                disabled={isSystem}
                value={form.slug}
                onChange={(e) => update("slug", e.target.value.toLowerCase())}
                placeholder="returns-policy"
              />
            </PillField>
          </div>
          {publicUrl && (
            <p className="text-[11px] text-ink-500 sm:text-xs">
              Public URL: <span className="font-mono text-ink-700">{publicUrl}</span>
            </p>
          )}
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Footer placement" hint="Where this page appears in the site footer.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            <PillField
              label="Footer label"
              htmlFor="footerLabel"
              required
              hint="Text shown in the footer column."
            >
              <PillInput
                id="footerLabel"
                icon={Tag}
                required
                value={form.footerLabel}
                onChange={(e) => update("footerLabel", e.target.value)}
                placeholder="Returns"
              />
            </PillField>
            <PillField label="Group" htmlFor="group" required hint="Which footer column.">
              <PillListbox
                id="group"
                icon={FolderTree}
                value={GROUP_LABEL[form.group]}
                onChange={(label) => update("group", groupFromLabel(label))}
                options={Object.values(GROUP_LABEL)}
                placeholder="Select column"
              />
            </PillField>
            <PillField
              label="Sort order"
              htmlFor="sortOrder"
              required
              hint="Lower numbers appear first."
            >
              <PillInput
                id="sortOrder"
                icon={Layers}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={form.sortOrder === 0 ? "" : form.sortOrder}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    update("sortOrder", 0);
                    return;
                  }
                  const n = Number(raw);
                  update("sortOrder", Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
                }}
              />
            </PillField>
          </div>

          <label
            htmlFor="visible"
            className={clsx(
              "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-elevated p-3 transition sm:p-4",
              form.visible
                ? "border-accent-primary/40 bg-accent-primary/[0.04]"
                : "border-ink-500/15",
            )}
          >
            <input
              id="visible"
              type="checkbox"
              checked={form.visible}
              onChange={(e) => update("visible", e.target.checked)}
              className="sr-only"
            />
            <span
              className={clsx(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                form.visible
                  ? "bg-accent-primary text-white"
                  : "bg-ink-900/[0.06] text-accent-primary",
              )}
            >
              <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-ink-900">Visible on storefront</span>
              <span className="text-[11px] text-ink-500 sm:text-xs">
                Show in the footer and at{" "}
                <span className="font-mono">/p/{form.slug || "<slug>"}</span>.
              </span>
            </span>
            <span
              role="switch"
              aria-checked={form.visible}
              className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                form.visible ? "bg-accent-primary" : "bg-ink-500/25",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                  form.visible ? "translate-x-5" : "translate-x-0.5",
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
          title="Content"
          hint={
            hasExternalHref
              ? "This page links to a dedicated route — its content is edited elsewhere."
              : "Write in markdown. Use the toolbar to insert headings, links, images, and lists."
          }
        >
          {hasExternalHref ? (
            <div className="rounded-2xl border border-dashed border-ink-500/30 bg-bg-base p-4 text-[11px] text-ink-700 sm:p-5 sm:text-sm">
              This page&apos;s body lives in a dedicated admin editor. The footer entry still routes
              to <span className="font-mono text-[10px] sm:text-xs">{form.externalHref}</span>.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ink-500/15 bg-bg-base">
              <MarkdownEditor
                id="body"
                value={form.body}
                onChange={(v) => update("body", v)}
                rows={22}
              />
            </div>
          )}
        </FormSection>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {mode === "edit" && initial && !initial.isSystem ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || pending}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-danger/30 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {deleting ? "Deleting…" : "Delete page"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          {mode === "edit" && initial && (
            <span className="hidden text-[10px] text-ink-500 sm:inline-block sm:text-xs">
              Last updated {new Date(initial.updatedAt).toLocaleString()}
            </span>
          )}
          <PillSubmitButton
            pending={pending}
            pendingLabel="Saving…"
            className="self-stretch sm:self-auto"
          >
            {mode === "create" ? "Create page" : "Save changes"}
          </PillSubmitButton>
        </div>
      </div>

      {initial && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete this page?"
          description={`"${initial.title}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          cancelLabel="Keep it"
          tone="danger"
          icon={Trash2}
          pending={deleting}
        />
      )}
    </form>
  );
}
