import type { Category } from "@/types/domain";

export const CATEGORIES_FIXTURE: Category[] = [
  {
    id: "cat_silk",
    slug: "silk",
    name: "Silk Sarees",
    description: "Hand-woven silk drapes for weddings and milestones.",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 1,
  },
  {
    id: "cat_cotton",
    slug: "cotton",
    name: "Cotton Sarees",
    description: "Breathable everyday weaves from across India.",
    imageUrl:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 2,
  },
  {
    id: "cat_banarasi",
    slug: "banarasi",
    name: "Banarasi",
    description: "Heritage Banarasi brocade from the looms of Varanasi.",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    parentSlug: "silk",
    sortOrder: 3,
  },
  {
    id: "cat_kanjivaram",
    slug: "kanjivaram",
    name: "Kanjivaram",
    description: "Temple-bordered pure-silk Kanjivarams from Tamil Nadu.",
    imageUrl:
      "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=1200&q=80",
    parentSlug: "silk",
    sortOrder: 4,
  },
  {
    id: "cat_linen",
    slug: "linen",
    name: "Linen",
    description: "Crisp linen drapes for warm-weather wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 5,
  },
  {
    id: "cat_designer",
    slug: "designer",
    name: "Designer Edit",
    description: "Modern silhouettes from emerging Indian designers.",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=1200&q=80",
    parentSlug: null,
    sortOrder: 6,
  },
];
