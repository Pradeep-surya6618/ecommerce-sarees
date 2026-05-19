"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAboutAction } from "@/server/actions/admin-site-settings";
import { Input } from "@/components/ui/Input";
import type { AboutPageContent } from "@/types/domain";

export interface AboutPageEditorProps {
  initial: AboutPageContent;
}

export function AboutPageEditor({ initial }: AboutPageEditorProps) {
  const [form, setForm] = useState<AboutPageContent>(initial);
  const [pending, startTransition] = useTransition();

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

  const showPreview = form.imageUrl.trim() && /^https?:\/\//.test(form.imageUrl.trim());

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-md border border-ink-500/10 bg-bg-elevated p-6"
    >
      <Section title="Header">
        <Field label="Page title" htmlFor="title">
          <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} />
        </Field>
        <Field label="Subtitle / description" htmlFor="description">
          <Input
            id="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Intro">
        <Field
          label="Intro paragraph"
          htmlFor="introBody"
          hint="Shown right after the page title, before the hero image."
        >
          <Textarea
            id="introBody"
            rows={4}
            value={form.introBody}
            onChange={(e) => update("introBody", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Hero image">
        <Field label="Image URL" htmlFor="imageUrl" hint="Use a square or 16:9 photo for best fit.">
          <Input
            id="imageUrl"
            type="url"
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
          />
        </Field>
        <Field
          label="Image alt text"
          htmlFor="imageAlt"
          hint="Describe the photo for screen readers."
        >
          <Input
            id="imageAlt"
            value={form.imageAlt}
            onChange={(e) => update("imageAlt", e.target.value)}
          />
        </Field>
        {showPreview && (
          <div className="relative h-48 w-full overflow-hidden rounded-sm border border-ink-500/10 bg-ink-500/5">
            <Image
              src={form.imageUrl}
              alt={form.imageAlt}
              fill
              sizes="640px"
              className="object-cover"
            />
          </div>
        )}
      </Section>

      <Section title="Belief block">
        <Field label="Heading" htmlFor="beliefHeading">
          <Input
            id="beliefHeading"
            value={form.beliefHeading}
            onChange={(e) => update("beliefHeading", e.target.value)}
          />
        </Field>
        <Field label="Body" htmlFor="beliefBody">
          <Textarea
            id="beliefBody"
            rows={4}
            value={form.beliefBody}
            onChange={(e) => update("beliefBody", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Team block">
        <Field label="Heading" htmlFor="teamHeading">
          <Input
            id="teamHeading"
            value={form.teamHeading}
            onChange={(e) => update("teamHeading", e.target.value)}
          />
        </Field>
        <Field label="Body" htmlFor="teamBody">
          <Textarea
            id="teamBody"
            rows={4}
            value={form.teamBody}
            onChange={(e) => update("teamBody", e.target.value)}
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {!dirty && <span className="text-xs text-ink-500">No changes</span>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-ink-500/10 pb-6 last:border-b-0 last:pb-0">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{title}</h2>
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

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-sm border border-ink-500/30 bg-bg-base p-3 text-sm text-ink-900 transition focus:border-accent-primary focus:outline-none"
    />
  );
}
