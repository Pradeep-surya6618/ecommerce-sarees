"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Globe,
  Heart,
  Link as LinkIcon,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { addToCartAction } from "@/server/actions/cart";
import { addToWishlistAction, removeFromWishlistAction } from "@/server/actions/wishlist";
import { InstagramGlyph } from "@/components/shared/icons";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VariantPicker } from "@/components/ui/VariantPicker";
import type { Product } from "@/types/domain";

export function ProductBuyBox({
  product,
  initiallyInWishlist = false,
}: {
  product: Product;
  initiallyInWishlist?: boolean;
}) {
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0] ?? null;
  const [selectedSku, setSelectedSku] = useState<string | null>(firstInStock?.sku ?? null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(initiallyInWishlist);
  const [pendingAdd, startAdd] = useTransition();
  const [pendingBuy, startBuy] = useTransition();
  const [pendingWish, startWish] = useTransition();

  const selectedVariant = product.variants.find((v) => v.sku === selectedSku) ?? null;
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const maxQty = Math.max(1, Math.min(10, selectedVariant?.stock ?? 0));
  const primaryImage = product.images[0]?.url ?? "";
  const primarySku = product.variants[0]?.sku ?? product.id;

  // Estimated delivery window: today + 5 to today + 6 business-ish days.
  const today = new Date();
  const eta1 = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const eta2 = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  async function addToCart(): Promise<void> {
    if (!selectedVariant || !selectedSku) {
      toast.error("Please choose a variant first.");
      return;
    }
    await addToCartAction({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantSku: selectedSku,
      variantLabel: selectedVariant.size
        ? `${selectedVariant.colorName} · ${selectedVariant.size}`
        : selectedVariant.colorName,
      imageUrl: primaryImage,
      unitPricePaise: product.priceInPaise,
      unitMrpPaise: product.mrpInPaise,
      quantity,
    });
  }

  function onAddToCart() {
    if (!inStock) return;
    startAdd(async () => {
      try {
        await addToCart();
        toast.success(`Added ${quantity} × ${product.name} to cart`, {
          action: { label: "View cart", onClick: () => (window.location.href = "/cart") },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add to cart.");
      }
    });
  }

  function onBuyItNow() {
    if (!inStock) return;
    startBuy(async () => {
      try {
        await addToCart();
        window.location.href = "/checkout";
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't proceed to checkout.");
      }
    });
  }

  function onToggleWishlist() {
    startWish(async () => {
      try {
        const result = inWishlist
          ? await removeFromWishlistAction(product.id)
          : await addToWishlistAction({
              productId: product.id,
              productSlug: product.slug,
              productName: product.name,
              imageUrl: primaryImage,
              priceInPaise: product.priceInPaise,
              mrpInPaise: product.mrpInPaise,
            });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        if (inWishlist) {
          setInWishlist(false);
          toast.success("Removed from wishlist");
        } else {
          setInWishlist(true);
          toast.success("Added to wishlist");
        }
      } catch {
        toast.error("Couldn't update your wishlist. Please try again.");
      }
    });
  }

  function onCopyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy"),
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-7">
      {/* Title block */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <h1 className="font-display text-xl leading-tight text-ink-900 sm:text-3xl md:text-4xl">
          {product.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-500 sm:gap-x-3 sm:text-sm">
          <Link href="/about" className="font-medium text-accent-primary hover:underline">
            Saree Store
          </Link>
          <span className="hidden text-ink-500/40 sm:inline">|</span>
          <span className="font-mono text-[10px] uppercase tracking-wide sm:text-xs">
            SKU: {primarySku}
          </span>
          <span className="hidden text-ink-500/40 sm:inline">|</span>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 text-[11px] font-medium sm:text-sm",
              inStock ? "text-success" : "text-danger",
            )}
          >
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                inStock ? "bg-success" : "bg-danger",
              )}
            />
            {inStock ? "In Stock" : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Price block */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2 tabular-nums sm:gap-3">
          <span className="font-display text-2xl font-semibold text-accent-primary sm:text-3xl md:text-4xl">
            {formatRupees(product.priceInPaise)}
          </span>
          {product.mrpInPaise > product.priceInPaise && (
            <span className="text-sm text-ink-500 line-through sm:text-base">
              {formatRupees(product.mrpInPaise)}
            </span>
          )}
        </div>
        <span className="text-[11px] text-ink-500 sm:text-xs">Tax included.</span>
      </div>

      {/* Description */}
      <p className="text-sm text-ink-700 sm:text-base">{product.description}</p>

      {/* Variant picker */}
      <VariantPicker
        variants={product.variants}
        selectedSku={selectedSku}
        onChange={(sku) => {
          setSelectedSku(sku);
          setQuantity(1);
        }}
      />

      {/* Quantity + Add to cart row */}
      <div className="flex items-stretch gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={maxQty} />
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!inStock || pendingAdd}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm bg-ink-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          {pendingAdd ? "Adding…" : "Add to cart"}
        </button>
      </div>

      {/* Buy It Now */}
      <button
        type="button"
        onClick={onBuyItNow}
        disabled={!inStock || pendingBuy}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-accent-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingBuy ? "Working…" : "Buy It Now"}
      </button>

      {/* Inline actions row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-ink-500/10 py-4 text-sm text-ink-700">
        <button
          type="button"
          onClick={onToggleWishlist}
          disabled={pendingWish}
          aria-pressed={inWishlist}
          className={clsx(
            "inline-flex cursor-pointer items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50",
            inWishlist
              ? "text-accent-primary hover:text-accent-primary-hover"
              : "hover:text-ink-900",
          )}
        >
          <Heart className={clsx("h-4 w-4", inWishlist && "fill-current")} />
          {pendingWish
            ? inWishlist
              ? "Removing…"
              : "Adding…"
            : inWishlist
              ? "Remove from Wishlist"
              : "Add to Wishlist"}
        </button>
        <span className="inline-flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Delivery
        </span>
        <span className="inline-flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Shipping only in India
        </span>
      </div>

      {/* Estimated delivery */}
      <div className="inline-flex items-center gap-2 text-sm text-ink-700">
        <Truck className="h-4 w-4 text-accent-primary" />
        Estimated delivery:{" "}
        <span className="font-semibold text-ink-900">
          {fmtDay(eta1)} – {fmtDay(eta2)}
        </span>
      </div>

      {/* Share row */}
      <div className="flex items-center gap-3 border-t border-ink-500/10 pt-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">Share:</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Copy link"
            onClick={onCopyLink}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink-500/10 text-ink-700 transition hover:bg-ink-900 hover:text-white"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          {[
            {
              icon: InstagramGlyph,
              label: "Share on Instagram",
              href: "https://www.instagram.com/",
              hoverClass: "hover:bg-[#E1306C] hover:text-white",
            },
            {
              icon: WhatsAppIcon,
              label: "Share on WhatsApp",
              href: "https://wa.me/",
              hoverClass: "hover:bg-[#25D366] hover:text-white",
            },
            {
              icon: PinterestIcon,
              label: "Share on Pinterest",
              href: "https://www.pinterest.com/",
              hoverClass: "hover:bg-[#E60023] hover:text-white",
            },
            {
              icon: FacebookIcon,
              label: "Share on Facebook",
              href: "https://www.facebook.com/",
              hoverClass: "hover:bg-[#1877F2] hover:text-white",
            },
            {
              icon: Mail,
              label: "Share via email",
              href: "mailto:",
              hoverClass: "hover:bg-accent-primary hover:text-white",
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={item.label}
              className={clsx(
                "inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-500/10 text-ink-700 transition",
                item.hoverClass,
              )}
            >
              <item.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {/* Shop with Confidence */}
      <div className="flex flex-col gap-4 rounded-md border border-ink-500/10 bg-bg-elevated p-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-display text-lg text-ink-900">Shop with Confidence</span>
          <SectionFlourish />
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: ShieldCheck, label: "Secure Transactions" },
            { icon: Truck, label: "Free Shipping in India" },
            { icon: Sparkles, label: "Premium Saree Quality" },
            { icon: Heart, label: "Personalized Styling" },
          ].map((b) => (
            <li key={b.label} className="inline-flex items-center gap-2 text-sm text-ink-700">
              <b.icon className="h-4 w-4 text-accent-primary" />
              {b.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.93 9.93 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.05 20.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.4 5.82c0 4.54-3.7 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.55.13-.16.25-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.23.25-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.23 2.63 7.84 6.34 9.29-.09-.79-.17-2 .03-2.86.18-.78 1.17-4.97 1.17-4.97s-.3-.6-.3-1.48c0-1.39.81-2.43 1.81-2.43.85 0 1.27.64 1.27 1.41 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.81 1.48 1.81 1.78 0 3.14-1.87 3.14-4.57 0-2.39-1.72-4.06-4.17-4.06-2.84 0-4.51 2.13-4.51 4.33 0 .86.33 1.78.74 2.28.08.1.09.18.07.29-.07.31-.25 1.01-.28 1.15-.04.19-.15.23-.34.14-1.25-.58-2.03-2.41-2.03-3.88 0-3.16 2.29-6.06 6.61-6.06 3.47 0 6.17 2.47 6.17 5.78 0 3.45-2.18 6.23-5.2 6.23-1.01 0-1.97-.53-2.3-1.15l-.62 2.38c-.23.86-.83 1.93-1.23 2.59.93.29 1.91.44 2.94.44 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.52l.38-2.94H13.5V8.7c0-.85.24-1.43 1.46-1.43h1.56V4.64c-.27-.04-1.2-.12-2.28-.12-2.25 0-3.79 1.37-3.79 3.9v2.17H8v2.94h2.45V21h3.05z" />
    </svg>
  );
}

function SectionFlourish() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 14"
      className="h-3 w-20 text-accent-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 7 Q 14 0 26 7" />
      <path d="M54 7 Q 66 14 78 7" />
      <path d="M40 11 a 3 3 0 0 1 -6 -3 a 3 3 0 0 1 6 0 a 3 3 0 0 1 6 3 a 3 3 0 0 1 -6 0z" />
    </svg>
  );
}
