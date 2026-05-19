import { nanoid } from "nanoid";
import { NAV_MENU_FIXTURE } from "@/lib/db/fixtures/nav-menu";
import type { NavMenuItem, NavMenuItemInput } from "@/types/domain";

export interface NavMenuTreeNode {
  item: NavMenuItem;
  children: NavMenuItem[];
}

export interface NavMenuRepo {
  list(): Promise<NavMenuItem[]>;
  listTopLevel(): Promise<NavMenuItem[]>;
  listChildren(parentId: string): Promise<NavMenuItem[]>;
  listTree(visibleOnly?: boolean): Promise<NavMenuTreeNode[]>;
  getById(id: string): Promise<NavMenuItem | null>;
  create(input: NavMenuItemInput): Promise<NavMenuItem>;
  update(id: string, input: Partial<NavMenuItemInput>): Promise<NavMenuItem | null>;
  delete(id: string): Promise<void>;
}

declare global {
  var __mockNavMenu: Map<string, NavMenuItem> | undefined;
}

function getStore(): Map<string, NavMenuItem> {
  if (globalThis.__mockNavMenu) return globalThis.__mockNavMenu;
  const store = new Map<string, NavMenuItem>();
  for (const i of NAV_MENU_FIXTURE) store.set(i.id, i);
  globalThis.__mockNavMenu = store;
  return store;
}

function bySortOrder(a: NavMenuItem, b: NavMenuItem): number {
  return a.sortOrder - b.sortOrder;
}

export const navMenuRepo: NavMenuRepo = {
  async list() {
    return [...getStore().values()].slice().sort(bySortOrder);
  },

  async listTopLevel() {
    return [...getStore().values()].filter((i) => i.parentId === null).sort(bySortOrder);
  },

  async listChildren(parentId) {
    return [...getStore().values()].filter((i) => i.parentId === parentId).sort(bySortOrder);
  },

  async listTree(visibleOnly = false) {
    const all = [...getStore().values()];
    const filter = visibleOnly ? (i: NavMenuItem) => i.visible : () => true;
    const parents = all.filter((i) => i.parentId === null && filter(i)).sort(bySortOrder);
    return parents.map((item) => ({
      item,
      children: all.filter((c) => c.parentId === item.id && filter(c)).sort(bySortOrder),
    }));
  },

  async getById(id) {
    return getStore().get(id) ?? null;
  },

  async create(input) {
    const store = getStore();
    const item: NavMenuItem = {
      id: `nav_${nanoid(10)}`,
      ...input,
    };
    store.set(item.id, item);
    return item;
  },

  async update(id, input) {
    const store = getStore();
    const existing = store.get(id);
    if (!existing) return null;
    // Disallow making an item its own ancestor.
    if (input.parentId === id) {
      throw new Error("An item cannot be its own parent.");
    }
    const updated: NavMenuItem = { ...existing, ...input };
    store.set(id, updated);
    return updated;
  },

  async delete(id) {
    const store = getStore();
    // Cascade: remove children too.
    for (const i of [...store.values()]) {
      if (i.parentId === id) store.delete(i.id);
    }
    store.delete(id);
  },
};

export function __resetNavMenuRepo(): void {
  globalThis.__mockNavMenu = undefined;
}
