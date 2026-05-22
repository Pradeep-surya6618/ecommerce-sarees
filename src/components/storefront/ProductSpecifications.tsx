import {
  Calendar,
  CheckCircle2,
  Diamond,
  Hash,
  Layers,
  ListChecks,
  Shirt,
  Sparkles,
  Square,
  Truck,
  WashingMachine,
  Weight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Product } from "@/types/domain";

interface SpecEntry {
  label: string;
  value: string;
  icon: LucideIcon;
  swatch?: string;
}

function titleCase(s: string): string {
  return s.replace(/(^|\s|-)\S/g, (m) => m.toUpperCase());
}

function deriveSpecs(product: Product): SpecEntry[] {
  const primary = product.variants[0];
  const secondary = product.variants[1];
  const occasions = product.occasion.map(titleCase).join(", ") || "Everyday Wear";
  const tags = new Set(product.tags.map((t) => t.toLowerCase()));
  const stored = product.specifications;

  const hasZari = tags.has("zari") || /silk|kanjivaram|banarasi|paithani/i.test(product.fabric);
  const isCotton = /cotton|linen/i.test(product.fabric);

  // Prefer the admin-set value; fall back to the derived default when empty.
  const pick = (stored: string | undefined, derived: string): string =>
    stored && stored.trim().length > 0 ? stored : derived;

  return [
    {
      label: "Color",
      value: primary ? titleCase(primary.colorName) : "—",
      icon: Hash,
      swatch: primary?.colorHex,
    },
    {
      label: "Sub Color",
      value: secondary ? titleCase(secondary.colorName) : "—",
      icon: Hash,
      swatch: secondary?.colorHex,
    },
    {
      label: "Zari Type",
      value: pick(stored?.zariType, hasZari ? "Gold" : "None"),
      icon: Sparkles,
    },
    {
      label: "Zari Color",
      value: pick(stored?.zariColor, hasZari ? "Gold" : "—"),
      icon: Sparkles,
    },
    { label: "Material", value: product.fabric, icon: Layers },
    {
      label: "Pattern",
      value: pick(
        stored?.pattern,
        tags.has("ikat")
          ? "Ikat"
          : tags.has("jamdani")
            ? "Jamdani Motifs"
            : tags.has("handblock") || tags.has("bagru")
              ? "Hand-Block"
              : "Floral Patterns",
      ),
      icon: Square,
    },
    { label: "Border Type", value: pick(stored?.borderType, "Contrast"), icon: ListChecks },
    {
      label: "Ornamentation",
      value: pick(stored?.ornamentation, hasZari ? "Zari Work" : "Hand-Block"),
      icon: Diamond,
    },
    { label: "Blouse Type", value: pick(stored?.blouseType, "With Blouse"), icon: Shirt },
    { label: "Occasion", value: occasions, icon: Calendar },
    {
      label: "Wash Type",
      value: pick(stored?.washType, isCotton ? "Gentle Hand Wash" : "Dry Wash Only"),
      icon: WashingMachine,
    },
    {
      label: "Delivery Time",
      value: pick(stored?.deliveryTime, "4 to 5 working days"),
      icon: Truck,
    },
    { label: "Weight", value: pick(stored?.weight, "0.80 Kg"), icon: Weight },
  ];
}

export function ProductSpecifications({ product }: { product: Product }) {
  const specs = deriveSpecs(product);
  return (
    <section className="rounded-lg border border-ink-500/10 bg-bg-elevated p-6">
      <header className="mb-6 inline-flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-accent-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-900">
          Specifications
        </h2>
      </header>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {specs.map((spec) => (
          <li
            key={spec.label}
            className="flex items-center gap-3 rounded-md border border-ink-500/10 bg-bg-base p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
              {spec.swatch ? (
                <span
                  className="h-5 w-5 rounded-full border border-white/60 shadow-inner"
                  style={{ background: spec.swatch }}
                />
              ) : (
                <spec.icon className="h-4 w-4" />
              )}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                {spec.label}
              </span>
              <span className="text-sm font-medium text-ink-900">{spec.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
