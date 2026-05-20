import { nanoid } from "nanoid";
import { CONTENT_PAGES_FIXTURE } from "@/lib/db/fixtures/content-pages";
import type { ContentPage, ContentPageGroup, ContentPageInput } from "@/types/domain";

export interface ContentPagesRepo {
  list(): Promise<ContentPage[]>;
  listVisible(): Promise<ContentPage[]>;
  listByGroup(group: ContentPageGroup): Promise<ContentPage[]>;
  getById(id: string): Promise<ContentPage | null>;
  getBySlug(slug: string): Promise<ContentPage | null>;
  create(input: ContentPageInput): Promise<ContentPage>;
  update(id: string, input: Partial<ContentPageInput>): Promise<ContentPage | null>;
  delete(id: string): Promise<void>;
}

declare global {
  var __mockContentPages: Map<string, ContentPage> | undefined;
}

function getStore(): Map<string, ContentPage> {
  if (globalThis.__mockContentPages) return globalThis.__mockContentPages;
  const store = new Map<string, ContentPage>();
  for (const p of CONTENT_PAGES_FIXTURE) store.set(p.id, { ...p });
  globalThis.__mockContentPages = store;
  return store;
}

function sortByGroupOrder(a: ContentPage, b: ContentPage): number {
  return a.sortOrder - b.sortOrder;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function assertSlugUnique(store: Map<string, ContentPage>, slug: string, exceptId?: string) {
  for (const p of store.values()) {
    if (p.slug === slug && p.id !== exceptId) {
      throw new Error(`A page with the slug "${slug}" already exists.`);
    }
  }
}

export const contentPagesRepo: ContentPagesRepo = {
  async list() {
    return [...getStore().values()].sort(sortByGroupOrder);
  },

  async listVisible() {
    return [...getStore().values()].filter((p) => p.visible).sort(sortByGroupOrder);
  },

  async listByGroup(group) {
    return [...getStore().values()]
      .filter((p) => p.group === group && p.visible)
      .sort(sortByGroupOrder);
  },

  async getById(id) {
    return getStore().get(id) ?? null;
  },

  async getBySlug(slug) {
    for (const p of getStore().values()) {
      if (p.slug === slug) return p;
    }
    return null;
  },

  async create(input) {
    const store = getStore();
    if (!isValidSlug(input.slug)) {
      throw new Error("Slug must be lowercase letters, numbers, and hyphens only.");
    }
    assertSlugUnique(store, input.slug);
    const now = new Date().toISOString();
    const page: ContentPage = {
      id: `page_${nanoid(10)}`,
      slug: input.slug,
      title: input.title,
      body: input.body,
      footerLabel: input.footerLabel,
      group: input.group,
      sortOrder: input.sortOrder,
      visible: input.visible,
      isSystem: false,
      externalHref: input.externalHref ?? null,
      createdAt: now,
      updatedAt: now,
    };
    store.set(page.id, page);
    return page;
  },

  async update(id, input) {
    const store = getStore();
    const existing = store.get(id);
    if (!existing) return null;
    if (input.slug !== undefined) {
      if (!isValidSlug(input.slug)) {
        throw new Error("Slug must be lowercase letters, numbers, and hyphens only.");
      }
      assertSlugUnique(store, input.slug, id);
    }
    const updated: ContentPage = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  async delete(id) {
    const store = getStore();
    const existing = store.get(id);
    if (!existing) return;
    if (existing.isSystem) {
      throw new Error("System pages cannot be deleted. Hide them instead.");
    }
    store.delete(id);
  },
};

export function __resetContentPagesRepo(): void {
  globalThis.__mockContentPages = undefined;
}
