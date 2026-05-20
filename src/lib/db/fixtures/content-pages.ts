import type { ContentPage } from "@/types/domain";

const NOW = "2026-05-20T00:00:00.000Z";

export const CONTENT_PAGES_FIXTURE: ContentPage[] = [
  {
    id: "page_shipping",
    slug: "shipping",
    title: "Shipping",
    footerLabel: "Shipping",
    group: "help",
    sortOrder: 1,
    visible: true,
    isSystem: true,
    externalHref: null,
    createdAt: NOW,
    updatedAt: NOW,
    body: `Free shipping pan-India on orders over **₹2,000**. Below that, standard delivery is ₹80 and express is ₹200.

## How long it takes

Standard delivery lands in **5 business days**. Express in **2**. The pincode checker on each product page gives the canonical estimate for your address.

## Cash on delivery

COD is available across most Indian pincodes. Selected remote pincodes are prepaid only; we'll flag this at checkout if it applies.

## International shipping

Not currently. Please email us if you'd like an international quote; we can arrange ad-hoc shipping for orders above ₹50,000 with import duties handled at destination.`,
  },
  {
    id: "page_returns",
    slug: "returns",
    title: "Returns",
    footerLabel: "Returns",
    group: "help",
    sortOrder: 2,
    visible: true,
    isSystem: true,
    externalHref: null,
    createdAt: NOW,
    updatedAt: NOW,
    body: `We accept returns within **7 days** of delivery for unworn, unaltered pieces with original tags and packaging.

## How to return

1. Email **returns@sareestore.example** with your order number.
2. Pack the saree with all original tags and the dispatch note.
3. Hand it to our reverse-logistics pickup; we'll book that for you.

## Refund timeline

Refunds land back on the original payment method within **5–7 business days** after we receive and inspect the piece.

## Exceptions

Pre-altered blouses, custom falls, and pieces marked *final sale* on the product page are not returnable. We'll always flag this clearly before you check out.`,
  },
  {
    id: "page_care",
    slug: "care",
    title: "Saree care",
    footerLabel: "Saree care",
    group: "help",
    sortOrder: 3,
    visible: true,
    isSystem: true,
    externalHref: null,
    createdAt: NOW,
    updatedAt: NOW,
    body: `A well-kept saree outlives the trend cycle. Here's how we recommend caring for the pieces we ship.

## First wear

Air the saree for a day before draping. Steam — don't iron directly — to settle the folds. A muslin pressing cloth between the iron and the weave keeps zari intact.

## Washing

- **Silk & zari:** dry clean only. Use a specialist who knows handlooms.
- **Cotton:** cold water hand-wash with a gentle detergent. Don't wring. Line-dry in shade.
- **Linen:** machine-wash on the gentle cycle, separately, with cold water.

## Storage

Wrap in unbleached muslin, never plastic. Refold every 2–3 months along a different line to prevent permanent creases. Keep two small muslin pouches of cloves nearby — they discourage silverfish without staining.`,
  },
  {
    id: "page_contact",
    slug: "contact",
    title: "Get in touch",
    footerLabel: "Contact",
    group: "help",
    sortOrder: 4,
    visible: true,
    isSystem: true,
    externalHref: null,
    createdAt: NOW,
    updatedAt: NOW,
    body: `Questions about a piece, a custom request, an order — we read every message.

## Email

[hello@sareestore.example](mailto:hello@sareestore.example) · replies within one business day.

## Phone

**+91 80 4567 8901** · Mon–Sat, 10:00–18:00 IST.

## Visit

Saree Store, 27 Lavelle Road, Bengaluru 560001, KA, India.

## Wholesale & press

For bulk corporate gifting, wholesale enquiries, or press requests, write to [partnerships@sareestore.example](mailto:partnerships@sareestore.example). Include your country, brand, and any timeline.`,
  },
  {
    id: "page_about",
    slug: "about",
    title: "Our story",
    footerLabel: "Our story",
    group: "company",
    sortOrder: 1,
    visible: true,
    isSystem: true,
    externalHref: "/about",
    createdAt: NOW,
    updatedAt: NOW,
    body: "",
  },
  {
    id: "page_journal",
    slug: "blog",
    title: "Journal",
    footerLabel: "Journal",
    group: "company",
    sortOrder: 2,
    visible: true,
    isSystem: true,
    externalHref: "/blog",
    createdAt: NOW,
    updatedAt: NOW,
    body: "",
  },
  {
    id: "page_terms",
    slug: "terms",
    title: "Terms of service",
    footerLabel: "Terms",
    group: "company",
    sortOrder: 3,
    visible: true,
    isSystem: true,
    externalHref: null,
    createdAt: NOW,
    updatedAt: NOW,
    body: `These terms govern your use of Saree Store and any orders you place with us.

## Orders & pricing

All prices on the site are inclusive of GST unless otherwise noted. We reserve the right to refuse or cancel any order in cases of clear pricing or inventory error; in that case any payment received is refunded in full.

## Payments

We accept UPI, cards, netbanking, and selected wallets via Razorpay, and cash on delivery on eligible pincodes.

## Intellectual property

All photography, copy, and motifs on this site belong to Saree Store. You may not reuse or republish them without written permission.

## Liability

Our liability for any order is capped at the value of that order. We are not responsible for delays caused by carriers, customs, or events outside our reasonable control.`,
  },
  {
    id: "page_privacy",
    slug: "privacy",
    title: "Privacy policy",
    footerLabel: "Privacy",
    group: "company",
    sortOrder: 4,
    visible: true,
    isSystem: true,
    externalHref: null,
    createdAt: NOW,
    updatedAt: NOW,
    body: `This policy explains what data we collect, why we collect it, and how you can control it.

## What we collect

- **Account data:** name, email, phone — used to identify your account and send order updates.
- **Address data:** for shipping and tax. Stored only for orders you place.
- **Usage data:** anonymised analytics about which pages you view, used to improve the store.

## How we use it

Strictly to fulfil your order, communicate about it, and improve the shop. We don't sell your data to any third party.

## Your rights

You can request a copy of your data, or ask us to delete your account, at any time. Email [privacy@sareestore.example](mailto:privacy@sareestore.example) and we'll respond within 7 days.

## Cookies

We use a small number of strictly-functional cookies (cart, session) and one analytics cookie. You can opt out of analytics from the cookie banner.`,
  },
];
