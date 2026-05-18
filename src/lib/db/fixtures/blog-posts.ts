import type { BlogPost } from "@/types/domain";

const IVORY =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80";
const MAROON =
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1600&q=80";
const GREEN =
  "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=1600&q=80";
const LINEN =
  "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=1600&q=80";

export const BLOG_POSTS_FIXTURE: BlogPost[] = [
  {
    id: "post_kanjivaram_guide",
    slug: "how-to-choose-a-kanjivaram",
    title: "How to choose a Kanjivaram, the right way",
    excerpt:
      "A practical guide to weights, weaves, zari grades, and what truly matters when you bring home a Kanjivaram.",
    body: `A real Kanjivaram begins with two things: pure mulberry silk and pure zari. Everything else — the motifs, the border width, the pallu length — is taste.

When you hold a Kanjivaram, weight is a reasonable proxy for honesty. Six-yard pieces typically sit between 700 grams and 900 grams. Anything lighter is either tissue-blended or finer-count silk; both are valid choices but priced differently.

Zari grades are stamped by the Silk Mark. Look for the holographic sticker on the pallu. If a piece is being sold without the Silk Mark and the seller can't explain why, walk away.

Motifs come in pairs: temple, mango, peacock, parrot, lotus, vine. Designers pair a motif with a complementary border — a temple border with mango butti, a mango border with vine butti. Mixing motifs without intent reads as showy.

The last test: ask the seller where the saree was woven. Kanchipuram is the gold standard. A good seller will name the cooperative and tell you something about the weaver. If the answer is vague, the saree probably wasn't woven there.`,
    coverImageUrl: MAROON,
    coverImageAlt: "Maroon Kanjivaram detail",
    authorName: "Mira Iyer",
    tags: ["kanjivaram", "guide", "silk"],
    status: "published",
    publishedAt: "2026-04-22T09:00:00Z",
    createdAt: "2026-04-22T09:00:00Z",
    updatedAt: "2026-04-22T09:00:00Z",
  },
  {
    id: "post_caring_for_silk",
    slug: "how-to-care-for-silk-sarees",
    title: "Caring for silk: the four rules that matter",
    excerpt: "Storage, washing, ironing, repair — what to actually do, in order.",
    body: `Silk is a protein fibre. It dislikes water, heat, and direct sunlight. Build your routine around those three facts and your saree will last decades.

Storage. Fold loosely along the existing creases and wrap in unbleached cotton or muslin. Refold every six months along a different line so the same fibres don't bear the stress.

Washing. Dry clean for the first wash. After that, only spot-clean with a damp white cloth. Soap of any kind dulls zari; if the saree absolutely has to be cleaned, use a saree dhobi who works with pure silks.

Ironing. Reverse side, low temperature, no steam. Place a thin cotton dupatta between the iron and the pallu.

Repair. If a thread pulls, take it to a karigar. Don't snip — pulled threads can be coaxed back through with patience.`,
    coverImageUrl: IVORY,
    coverImageAlt: "Folded ivory saree",
    authorName: "Mira Iyer",
    tags: ["care", "silk"],
    status: "published",
    publishedAt: "2026-04-18T09:00:00Z",
    createdAt: "2026-04-18T09:00:00Z",
    updatedAt: "2026-04-18T09:00:00Z",
  },
  {
    id: "post_workweek_drapes",
    slug: "five-sarees-for-the-working-week",
    title: "Five sarees for the working week",
    excerpt: "Crisp drapes that survive a 9-to-7 and still photograph well at the coffee machine.",
    body: `Office sarees are a constraint problem. They have to be light, wrinkle-resistant, and quiet enough not to compete with the work.

Linen wins by default. Hand-block prints in muted colour blocks read as serious. Pair with a structured blouse and minimum jewellery.

Khadi is the dark horse. It softens beautifully after three washes and never looks try-hard.

Pochampally ikat in a single colour is a quiet flex. The pattern is enough; let the rest of the look stay neutral.

Mysore silk in plain rust or teal makes Tuesday feel like Friday. Keep the border narrow.

Hand-block cotton for the heaviest meetings. Wide pleats, no pallu drama, and crisp ironing the night before.`,
    coverImageUrl: LINEN,
    coverImageAlt: "Linen saree draped over chair",
    authorName: "Anita Sharma",
    tags: ["office", "linen", "cotton"],
    status: "published",
    publishedAt: "2026-04-08T09:00:00Z",
    createdAt: "2026-04-08T09:00:00Z",
    updatedAt: "2026-04-08T09:00:00Z",
  },
  {
    id: "post_paithani_origins",
    slug: "the-paithani-and-its-peacocks",
    title: "The Paithani and its peacocks",
    excerpt:
      "Why a saree from a small Maharashtrian town became the most coveted piece on every bridal trunk.",
    body: `Paithan is a small town on the banks of the Godavari, half an hour from Aurangabad. It is the original home of the Paithani.

The defining feature is the woven peacock, threaded into the pallu using kadhwa weaving — a single-shuttle technique where each motif is hand-inserted. A traditional Paithani peacock takes a weaver between three and seven days for the pallu alone.

Colour pairings follow strict rules: peacock green with pink, magenta with parrot green, royal blue with yellow. A Paithani in a "modern" colour like ivory is usually a contemporary piece — beautiful, but not in the lineage.

A new Paithani feels stiff because the silk is unwashed. Drape it once, then let it rest for two weeks. The second wear is the one that flows.`,
    coverImageUrl: GREEN,
    coverImageAlt: "Green Paithani pallu",
    authorName: "Mira Iyer",
    tags: ["paithani", "heritage", "silk"],
    status: "published",
    publishedAt: "2026-03-30T09:00:00Z",
    createdAt: "2026-03-30T09:00:00Z",
    updatedAt: "2026-03-30T09:00:00Z",
  },
];
