"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createContentPageAction,
  deleteContentPageAction,
  updateContentPageAction,
} from "@/server/actions/admin-content-pages";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Input } from "@/components/ui/Input";
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
  sortOrder: 10,
  visible: true,
  externalHref: null,
};

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

  function update<K extends keyof ContentPageInput>(key: K, value: ContentPageInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createContentPageAction(form);
          toast.success("Page created");
          router.push(`/admin/pages/${created.id}`);
        } else if (initial) {
          await updateContentPageAction(initial.id, form);
          toast.success("Page updated");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save changes.");
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.title}"? This cannot be undone.`)) return;
    startDelete(async () => {
      try {
        await deleteContentPageAction(initial.id);
        toast.success("Page deleted");
        router.push("/admin/pages");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't delete this page.");
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
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-md border border-ink-500/10 bg-bg-elevated p-6"
    >
      {/* ── Meta ── */}
      <Section title="Page details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" htmlFor="title" hint="Shown as the page heading.">
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="slug"
            hint={
              isSystem
                ? "System pages have a fixed slug — wired to the storefront route."
                : "Lowercase letters, numbers, hyphens. Used in the URL."
            }
          >
            <Input
              id="slug"
              required
              disabled={isSystem}
              value={form.slug}
              onChange={(e) => update("slug", e.target.value.toLowerCase())}
              placeholder="returns-policy"
            />
          </Field>
        </div>
        {publicUrl && (
          <p className="text-xs text-ink-500">
            Public URL: <span className="font-mono text-ink-700">{publicUrl}</span>
          </p>
        )}
      </Section>

      {/* ── Footer placement ── */}
      <Section title="Footer placement">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Footer label" htmlFor="footerLabel" hint="Text shown in the footer column.">
            <Input
              id="footerLabel"
              required
              value={form.footerLabel}
              onChange={(e) => update("footerLabel", e.target.value)}
            />
          </Field>
          <Field label="Group" htmlFor="group" hint="Which footer column shows this page.">
            <select
              id="group"
              value={form.group}
              onChange={(e) => update("group", e.target.value as ContentPageGroup)}
              className="h-11 w-full cursor-pointer rounded-sm border border-ink-500/30 bg-bg-base px-3 text-sm text-ink-900 transition focus:border-accent-primary focus:outline-none"
            >
              <option value="help">Help</option>
              <option value="company">Company</option>
              <option value="none">None (not in footer)</option>
            </select>
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers appear first.">
            <Input
              id="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", Number(e.target.value))}
            />
          </Field>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => update("visible", e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-accent-primary"
          />
          Visible on storefront and in the footer
        </label>
      </Section>

      {/* ── Body ── */}
      <Section
        title="Content"
        hint={
          hasExternalHref
            ? "This page links to a dedicated route — its content is edited elsewhere."
            : "Write in markdown. Use the toolbar buttons to insert headings, links, images, and lists."
        }
      >
        {hasExternalHref ? (
          <div className="rounded-sm border border-dashed border-ink-500/30 bg-bg-base p-4 text-sm text-ink-700">
            This page&apos;s body lives in a dedicated admin editor. The footer entry still routes
            to <span className="font-mono text-xs">{form.externalHref}</span>.
          </div>
        ) : (
          <MarkdownEditor
            id="body"
            value={form.body}
            onChange={(v) => update("body", v)}
            rows={22}
          />
        )}
      </Section>

      {/* ── Footer actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : mode === "create" ? "Create page" : "Save changes"}
          </button>
          {mode === "edit" && initial && (
            <span className="text-xs text-ink-500">
              Last updated {new Date(initial.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        {mode === "edit" && initial && !initial.isSystem && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete page"}
          </button>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-ink-500/10 pb-6 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{title}</h2>
        {hint && <p className="text-xs text-ink-500">{hint}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-900">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  );
}
