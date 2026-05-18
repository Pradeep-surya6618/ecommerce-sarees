"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AtSign,
  Globe,
  Heart,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import { addToCartAction } from "@/server/actions/cart";
import { addToWishlistAction } from "@/server/actions/wishlist";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VariantPicker } from "@/components/ui/VariantPicker";
import type { Product } from "@/types/domain";

export function ProductBuyBox({ product }: { product: Product }) {
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0] ?? null;
  const [selectedSku, setSelectedSku] = useState<string | null>(firstInStock?.sku ?? null);
  const [quantity, setQuantity] = useState(1);
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

  function onAddToWishlist() {
    startWish(async () => {
      try {
        await addToWishlistAction({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          imageUrl: primaryImage,
          priceInPaise: product.priceInPaise,
          mrpInPaise: product.mrpInPaise,
        });
        toast.success("Added to wishlist");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign in to use the wishlist.");
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
    <div className="flex flex-col gap-7">
      {/* Title block */}
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl text-ink-900 md:text-4xl">{product.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
          <Link href="/about" className="font-medium text-accent-primary hover:underline">
            Saree Store
          </Link>
          <span className="hidden text-ink-500/40 sm:inline">|</span>
          <span className="font-mono text-xs uppercase tracking-wide">SKU: {primarySku}</span>
          <span className="hidden text-ink-500/40 sm:inline">|</span>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 text-sm font-medium",
              inStock ? "text-success" : "text-danger",
            )}
          >
            <span className={clsx("h-2 w-2 rounded-full", inStock ? "bg-success" : "bg-danger")} />
            {inStock ? "In Stock" : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Price block */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3 tabular-nums">
          <span className="font-display text-3xl font-semibold text-accent-primary md:text-4xl">
            {formatRupees(product.priceInPaise)}
          </span>
          {product.mrpInPaise > product.priceInPaise && (
            <span className="text-base text-ink-500 line-through">
              {formatRupees(product.mrpInPaise)}
            </span>
          )}
        </div>
        <span className="text-xs text-ink-500">Tax included.</span>
      </div>

      {/* Description */}
      <p className="text-ink-700">{product.description}</p>

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
          className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-ink-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        className="flex items-center justify-center gap-2 rounded-sm bg-accent-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pendingBuy ? "Working…" : "Buy It Now"}
      </button>

      {/* Inline actions row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-ink-500/10 py-4 text-sm text-ink-700">
        <button
          type="button"
          onClick={onAddToWishlist}
          disabled={pendingWish}
          className="inline-flex items-center gap-2 transition hover:text-ink-900 disabled:opacity-50"
        >
          <Heart className="h-4 w-4" />
          {pendingWish ? "Adding…" : "Add to Wishlist"}
        </button>
        <span className="inline-flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Delivery
        </span>
        <span className="inline-flex items-center gap-2">
          <Globe className="h-4 w-4" />
          International Shipping
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
          {[
            { icon: LinkIcon, label: "Copy link", onClick: onCopyLink },
            { icon: AtSign, label: "Share on Instagram", onClick: undefined },
            { icon: MessageCircle, label: "Share on Messenger", onClick: undefined },
            { icon: Mail, label: "Share via email", onClick: undefined },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              onClick={item.onClick}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-500/10 text-ink-700 transition hover:bg-ink-900 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
            </button>
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
