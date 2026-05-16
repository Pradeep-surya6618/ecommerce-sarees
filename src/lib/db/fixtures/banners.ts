import type { Banner } from "@/types/domain";

export const BANNERS_FIXTURE: Banner[] = [
  {
    id: "bnr_wedding",
    placement: "home-hero",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Bridal silk saree draped on mannequin",
    title: "The Wedding Edit",
    subtitle: "Heirloom Kanjivarams, Banarasis and Paithanis for the season's mehendi to vidaai.",
    ctaLabel: "Shop Bridal",
    ctaHref: "/shop/silk",
    sortOrder: 1,
    active: true,
  },
  {
    id: "bnr_office",
    placement: "home-hero",
    imageUrl:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Crisp linen saree draped over chair",
    title: "Linens for the Working Week",
    subtitle: "Featherlight pure linens in modern, muted palettes.",
    ctaLabel: "Shop Linen",
    ctaHref: "/shop/linen",
    sortOrder: 2,
    active: true,
  },
  {
    id: "bnr_festive",
    placement: "home-hero",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Banarasi festive saree close-up",
    title: "Festive Brocades",
    subtitle: "Banarasis with meenakari pallus, made for diyas and dressy nights.",
    ctaLabel: "Shop Banarasi",
    ctaHref: "/shop/banarasi",
    sortOrder: 3,
    active: true,
  },
  {
    id: "bnr_designer_strip",
    placement: "home-strip",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Designer pre-stitched saree",
    title: "Now in: Designer Edit",
    ctaLabel: "Explore →",
    ctaHref: "/shop/designer",
    sortOrder: 1,
    active: true,
  },
];
