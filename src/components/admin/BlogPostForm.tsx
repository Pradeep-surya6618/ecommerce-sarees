"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Heading, Tag, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { type BlogPostInput } from "@/lib/db/repos/blog-posts";
import { clsx } from "@/lib/utils/clsx";
import {
  createBlogPostAction,
  deleteBlogPostAction,
  updateBlogPostAction,
} from "@/server/actions/admin-blog";
import {
  FormSection,
  PillField,
  PillInput,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { BlogPost } from "@/types/domain";

export interface BlogPostFormProps {
  mode: "create" | "edit";
  initial: BlogPost | null;
}

const DEFAULT_FORM: BlogPostInput = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  coverImageAlt: "",
  authorName: "Saree Store",
  tags: [],
  status: "draft",
};

function toInput(p: BlogPost): BlogPostInput {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    coverImageUrl: p.coverImageUrl,
    coverImageAlt: p.coverImageAlt,
    authorName: p.authorName,
    tags: p.tags,
    status: p.status,
  };
}

// Title → URL-safe slug. Strips diacritics + non-alphanumerics, collapses
// runs of dashes. Admin can still edit the result by hand.
function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogPostForm({ mode, initial }: BlogPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BlogPostInput>(initial ? toInput(initial) : DEFAULT_FORM);
  // If admin hasn't manually edited the slug, keep regenerating it from the
  // title — common authoring flow. Once they touch the slug field we stop.
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [tagsRaw, setTagsRaw] = useState(initial?.tags.join(", ") ?? "");
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function update<K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(next: string) {
    update("title", next);
    if (!slugDirty) update("slug", slugify(next));
  }

  function onTagsChange(next: string) {
    setTagsRaw(next);
    update(
      "tags",
      next
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createBlogPostAction(form)
            : initial
              ? await updateBlogPostAction(initial.id, form)
              : null;

        if (!result) return;
        if (!result.ok) {
          toast.error("Couldn't save post", { description: result.error });
          return;
        }

        if (mode === "create") {
          toast.success("Post created", {
            description:
              result.post.status === "published"
                ? `"${form.title}" is now live at /blog/${result.post.slug}.`
                : `"${form.title}" saved as a draft.`,
          });
        } else {
          toast.success("Post updated");
        }
        router.push("/admin/blog");
        router.refresh();
      } catch {
        toast.error("Couldn't save post. Please try again.");
      }
    });
  }

  function onDelete() {
    if (!initial) return;
    startDelete(async () => {
      try {
        const result = await deleteBlogPostAction(initial.id);
        if (!result.ok) {
          toast.error("Couldn't delete the post", { description: result.error });
          return;
        }
        toast.success("Post deleted", { description: `"${initial.title}" has been removed.` });
        router.push("/admin/blog");
        router.refresh();
      } catch {
        toast.error("Couldn't delete the post. Please try again.");
      }
    });
  }

  const hasCover = Boolean(form.coverImageUrl);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">
          {mode === "create" ? "New journal post" : "Edit journal post"}
        </h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Markdown body, S3-hosted cover image. Drafts are hidden from the storefront until you flip
          the status to <span className="font-medium">Published</span>.
        </p>
      </header>

      <FormSection title="Headline" hint="What the reader sees at the top of the post and card.">
        <PillField label="Title" htmlFor="title" required>
          <PillInput
            id="title"
            icon={Heading}
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Why a 9-yard saree drapes differently"
            required
          />
        </PillField>
        <PillField
          label="Slug"
          htmlFor="slug"
          required
          hint="Lowercase letters, numbers, and hyphens. Auto-generated from the title."
        >
          <PillInput
            id="slug"
            icon={Tag}
            value={form.slug}
            onChange={(e) => {
              setSlugDirty(true);
              update("slug", e.target.value);
            }}
            placeholder="why-a-9-yard-saree-drapes-differently"
            required
          />
        </PillField>
        <PillField
          label="Excerpt"
          htmlFor="excerpt"
          required
          hint="One or two sentences shown on the blog index and meta description."
        >
          <textarea
            id="excerpt"
            value={form.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
            rows={3}
            placeholder="A short tease for the reader…"
            className="w-full rounded-2xl border border-ink-500/15 bg-bg-elevated px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-accent-primary"
            required
          />
        </PillField>
      </FormSection>

      <FormSection
        title="Cover image"
        hint="16:9 ratio works best — gets cropped to fit the hero on the post page."
      >
        {hasCover && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-ink-500/10 bg-ink-500/5">
            <Image
              src={form.coverImageUrl}
              alt={form.coverImageAlt || "Cover preview"}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        {hasCover ? (
          // Once a cover is set, the dropzone shrinks to a pill-sized button —
          // right-align so it sits at the corner of the preview frame instead
          // of stretching across the whole field.
          <div className="flex justify-end">
            <ImageUploader
              folder="blog"
              variant="button"
              aspectRatio={16 / 9}
              label="Replace cover"
              hint="JPG, PNG, WebP, or AVIF · max 10 MB"
              onUploaded={(url) => update("coverImageUrl", url)}
            />
          </div>
        ) : (
          <ImageUploader
            folder="blog"
            variant="dropzone"
            aspectRatio={16 / 9}
            label="Upload cover"
            hint="JPG, PNG, WebP, or AVIF · max 10 MB"
            onUploaded={(url) => update("coverImageUrl", url)}
          />
        )}
        <PillField
          label="Alt text"
          htmlFor="coverImageAlt"
          required
          hint="Describe the image for screen readers and SEO."
        >
          <PillInput
            id="coverImageAlt"
            icon={Eye}
            value={form.coverImageAlt}
            onChange={(e) => update("coverImageAlt", e.target.value)}
            placeholder="Hands draping a red Kanjivaram saree"
            required
          />
        </PillField>
      </FormSection>

      <FormSection title="Body" hint="Markdown — toolbar buttons handle headings, lists, links.">
        <MarkdownEditor
          id="body"
          value={form.body}
          onChange={(next) => update("body", next)}
          rows={18}
          placeholder={"## Section heading\n\nYour story here…\n\n- bullet\n- another bullet"}
        />
      </FormSection>

      <FormSection title="Meta">
        <PillField label="Author" htmlFor="authorName" required>
          <PillInput
            id="authorName"
            icon={UserIcon}
            value={form.authorName}
            onChange={(e) => update("authorName", e.target.value)}
            placeholder="Saree Store"
            required
          />
        </PillField>
        <PillField
          label="Tags"
          htmlFor="tags"
          hint="Comma-separated. Used to surface related posts. e.g. kanjivaram, care, history"
        >
          <PillInput
            id="tags"
            icon={Tag}
            value={tagsRaw}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="kanjivaram, care, history"
          />
        </PillField>
        <PillField label="Status" htmlFor="status">
          <div className="flex gap-2">
            {(["draft", "published"] as const).map((value) => {
              const active = form.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("status", value)}
                  className={clsx(
                    "inline-flex h-10 cursor-pointer items-center justify-center rounded-full border px-5 text-sm font-medium transition",
                    active
                      ? value === "published"
                        ? "border-accent-primary bg-accent-primary text-white"
                        : "border-ink-900 bg-ink-900 text-white"
                      : "border-ink-500/15 bg-bg-elevated text-ink-700 hover:border-accent-primary hover:text-accent-primary",
                  )}
                >
                  {value === "published" ? "Published" : "Draft"}
                </button>
              );
            })}
          </div>
        </PillField>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex items-center justify-between gap-2 border-t border-ink-500/10 bg-bg-base px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        {mode === "edit" && initial && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={pending || deleting}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-danger/40 px-4 text-xs font-medium text-danger transition hover:border-danger hover:bg-danger/10 disabled:opacity-50 sm:text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete post
          </button>
        )}
        {/* `ml-auto` keeps Save pinned right even on create mode where the
            Delete button isn't rendered and justify-between has nothing on
            the left to push against. */}
        <div className="ml-auto">
          <PillSubmitButton pending={pending} pendingLabel="Saving…">
            {mode === "create" ? "Create post" : "Save changes"}
          </PillSubmitButton>
        </div>
      </div>

      {initial && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => {
            if (!deleting) setConfirmOpen(false);
          }}
          onConfirm={onDelete}
          title="Delete this journal post?"
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
