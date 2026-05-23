"use client";

import { forwardRef, useState, useTransition } from "react";
import {
  BookOpen,
  ChevronDown,
  Eye,
  FileText,
  Heading,
  ImageIcon,
  Sparkles,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "@/lib/utils/clsx";
import { updateAboutAction } from "@/server/actions/admin-site-settings";
import {
  FormSection,
  PillField,
  PillInput,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { AboutPageContent } from "@/types/domain";

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export interface AboutPageEditorProps {
  initial: AboutPageContent;
}

interface PillTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> {
  icon: LucideIcon;
  rows?: number;
  invalid?: boolean;
}

const PillTextarea = forwardRef<HTMLTextAreaElement, PillTextareaProps>(function PillTextarea(
  { icon: Icon, rows = 4, invalid, className, ...rest },
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
      <span className="pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.06] text-accent-primary sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          "w-full resize-y bg-transparent py-1.5 pr-2 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:py-2 sm:text-base",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

export function AboutPageEditor({ initial }: AboutPageEditorProps) {
  const [form, setForm] = useState<AboutPageContent>(initial);
  const [pending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(true);

  function update<K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const dirty =
    form.title !== initial.title ||
    form.description !== initial.description ||
    form.introBody !== initial.introBody ||
    form.imageUrl !== initial.imageUrl ||
    form.imageAlt !== initial.imageAlt ||
    form.beliefHeading !== initial.beliefHeading ||
    form.beliefBody !== initial.beliefBody ||
    form.teamHeading !== initial.teamHeading ||
    form.teamBody !== initial.teamBody;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateAboutAction(form);
        toast.success("About page updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save changes.");
      }
    });
  }

  const hasImage = form.imageUrl.trim().length > 0 && /^https?:\/\//.test(form.imageUrl.trim());

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Header" hint="The first thing visitors read.">
          <PillField label="Page title" htmlFor="title">
            <PillInput
              id="title"
              icon={Heading}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Our story"
            />
          </PillField>
          <PillField label="Subtitle / description" htmlFor="description">
            <PillInput
              id="description"
              icon={Tag}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Sarees, sourced directly from weavers across India."
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Intro" hint="Shown right after the page title, before the hero image.">
          <PillField label="Intro paragraph" htmlFor="introBody">
            <PillTextarea
              id="introBody"
              icon={FileText}
              rows={5}
              value={form.introBody}
              onChange={(e) => update("introBody", e.target.value)}
              placeholder="Saree Store began as a notebook of weavers…"
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Hero image" hint="Recommended: square or 16:9 photo. PNG, JPG or WEBP.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-[260px_1fr]">
            {hasImage ? (
              <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-base shadow-card md:h-44 md:w-[260px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt={form.imageAlt || "About hero preview"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="md:w-[260px]">
                <ImageUploader
                  folder="banners"
                  variant="dropzone"
                  label="Drop hero image"
                  hint="or click to browse · PNG, JPG, WEBP"
                  onUploaded={(url) => update("imageUrl", url)}
                />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <PillField label="Image URL" htmlFor="imageUrl">
                <PillInput
                  id="imageUrl"
                  icon={ImageIcon}
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="Paste a URL or upload above"
                />
              </PillField>
              <PillField
                label="Image alt text"
                htmlFor="imageAlt"
                hint="Describe the photo for screen readers."
              >
                <PillInput
                  id="imageAlt"
                  icon={Sparkles}
                  value={form.imageAlt}
                  onChange={(e) => update("imageAlt", e.target.value)}
                  placeholder="Weavers at a Kanjivaram handloom"
                />
              </PillField>
              {hasImage && (
                <ImageUploader
                  folder="banners"
                  label="Replace image"
                  className="self-start"
                  onUploaded={(url) => update("imageUrl", url)}
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
        <FormSection title="Belief block" hint="The “what we stand for” section.">
          <PillField label="Heading" htmlFor="beliefHeading">
            <PillInput
              id="beliefHeading"
              icon={BookOpen}
              value={form.beliefHeading}
              onChange={(e) => update("beliefHeading", e.target.value)}
              placeholder="What we believe"
            />
          </PillField>
          <PillField label="Body" htmlFor="beliefBody">
            <PillTextarea
              id="beliefBody"
              icon={FileText}
              rows={5}
              value={form.beliefBody}
              onChange={(e) => update("beliefBody", e.target.value)}
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Team block" hint="A short note about the people behind the store.">
          <PillField label="Heading" htmlFor="teamHeading">
            <PillInput
              id="teamHeading"
              icon={Users}
              value={form.teamHeading}
              onChange={(e) => update("teamHeading", e.target.value)}
              placeholder="The team"
            />
          </PillField>
          <PillField label="Body" htmlFor="teamBody">
            <PillTextarea
              id="teamBody"
              icon={FileText}
              rows={5}
              value={form.teamBody}
              onChange={(e) => update("teamBody", e.target.value)}
            />
          </PillField>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-gold/15 text-accent-gold sm:h-10 sm:w-10">
              <Eye className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
                Preview
              </span>
              <p className="text-[11px] leading-tight text-ink-500 sm:text-xs">
                Live rendering of <span className="font-mono">/about</span>. Updates as you type.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            aria-expanded={previewOpen}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/15 bg-bg-elevated px-3 text-[10px] font-medium uppercase tracking-wider text-ink-700 transition hover:border-accent-primary hover:text-accent-primary sm:h-9 sm:text-[11px]"
          >
            <ChevronDown
              className={clsx("h-3.5 w-3.5 transition", previewOpen ? "rotate-180" : "rotate-0")}
            />
            {previewOpen ? "Hide" : "Show"}
          </button>
        </header>

        {previewOpen && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink-500/10 bg-bg-base sm:mt-5">
            {/* Storefront chrome — eyebrow + breadcrumb hint, mirroring ProsePage. */}
            <div className="border-b border-ink-500/10 bg-bg-elevated/60 px-4 py-3 sm:px-6 sm:py-3.5">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-ink-500 sm:text-[10px]">
                Home · {form.title || "About"}
              </p>
            </div>
            <article className="flex flex-col gap-4 px-4 py-6 sm:gap-5 sm:px-8 sm:py-8 md:px-10 md:py-10">
              <header className="flex flex-col gap-2">
                <h1 className="font-display text-2xl leading-tight text-ink-900 sm:text-3xl md:text-4xl">
                  {form.title || <span className="text-ink-500 italic">Page title</span>}
                </h1>
                {form.description && (
                  <p className="text-sm text-ink-700 sm:text-base">{form.description}</p>
                )}
              </header>

              {paragraphs(form.introBody).length > 0 ? (
                <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-ink-700 sm:text-[15px]">
                  {paragraphs(form.introBody).map((p, i) => (
                    <p key={`intro-${i}`}>{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-ink-500">Intro paragraph will appear here.</p>
              )}

              {hasImage ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-ink-500/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt={form.imageAlt || form.title || "About hero"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-ink-500/20 bg-bg-elevated text-[11px] italic text-ink-500 sm:text-xs">
                  Hero image preview · upload one above
                </div>
              )}

              {form.beliefHeading && (
                <h2 className="mt-2 font-display text-xl text-ink-900 sm:text-2xl">
                  {form.beliefHeading}
                </h2>
              )}
              {paragraphs(form.beliefBody).length > 0 ? (
                <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-ink-700 sm:text-[15px]">
                  {paragraphs(form.beliefBody).map((p, i) => (
                    <p key={`belief-${i}`}>{p}</p>
                  ))}
                </div>
              ) : form.beliefHeading ? (
                <p className="text-xs italic text-ink-500">Belief body will appear here.</p>
              ) : null}

              {form.teamHeading && (
                <h2 className="mt-2 font-display text-xl text-ink-900 sm:text-2xl">
                  {form.teamHeading}
                </h2>
              )}
              {paragraphs(form.teamBody).length > 0 ? (
                <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-ink-700 sm:text-[15px]">
                  {paragraphs(form.teamBody).map((p, i) => (
                    <p key={`team-${i}`}>{p}</p>
                  ))}
                </div>
              ) : form.teamHeading ? (
                <p className="text-xs italic text-ink-500">Team body will appear here.</p>
              ) : null}
            </article>
          </div>
        )}
      </section>

      <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        {!dirty && !pending && (
          <span className="text-[10px] text-ink-500 sm:text-xs">No changes</span>
        )}
        <PillSubmitButton
          pending={pending}
          pendingLabel="Saving…"
          disabled={!dirty}
          className="self-stretch sm:self-auto"
        >
          Save changes
        </PillSubmitButton>
      </div>
    </form>
  );
}
