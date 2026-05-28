import "server-only";
import { getShippingOptions } from "@/lib/cart/shipping";
import { fetchShiprocketCouriers } from "@/lib/shipping/shiprocket";
import type { CartItem, ShippingOption, ShippingSettings } from "@/types/domain";

// Sarees are light; without a per-product weight field we assume 0.5 kg per
// unit (also Shiprocket's minimum billable weight). Swap for a real product
// weight when the catalogue gains one.
const DEFAULT_ITEM_WEIGHT_KG = 0.5;

export function computeCartWeightKg(items: CartItem[]): number {
  const units = items.reduce((sum, i) => sum + i.quantity, 0);
  return Math.max(DEFAULT_ITEM_WEIGHT_KG, units * DEFAULT_ITEM_WEIGHT_KG);
}

export interface ResolveShippingInput {
  deliveryPincode: string;
  subtotalPaise: number;
  weightKg: number;
  settings: ShippingSettings;
  /** Whether this is a COD order — couriers price COD higher. */
  cod?: boolean;
}

// The single source of truth for "what shipping options does this order get?".
// Both the checkout rate fetch and placeOrderAction call this, so the options
// (and their ids) are identical — the order action re-derives them to validate
// the customer's choice and bill the server-computed price, never the client's.
//
// Tries live Shiprocket courier rates first; falls back to the admin's flat
// rates whenever Shiprocket is unconfigured, unreachable, or can't service the
// pincode — so checkout always has options.
export async function resolveShippingOptions(
  input: ResolveShippingInput,
): Promise<ShippingOption[]> {
  const { deliveryPincode, subtotalPaise, weightKg, settings, cod = false } = input;
  const freeUnlocked = subtotalPaise >= settings.freeShippingThresholdPaise;

  const couriers = deliveryPincode
    ? await fetchShiprocketCouriers({ deliveryPincode, weightKg, cod })
    : null;

  // No live rates → flat fallback (already handles the free threshold).
  if (!couriers || couriers.length === 0) {
    return getShippingOptions(subtotalPaise, settings);
  }

  // Collapse the courier list into stable synthetic tiers so the option ids
  // ("sr_standard"/"sr_express") survive a re-fetch at order time even if the
  // underlying cheapest/fastest courier changes.
  const cheapest = [...couriers].sort((a, b) => a.ratePaise - b.ratePaise)[0]!;
  const fastest = [...couriers].sort((a, b) => a.etaDays - b.etaDays)[0]!;

  const options: ShippingOption[] = [];

  if (freeUnlocked) {
    options.push({ id: "free", name: "Free shipping", etaDays: cheapest.etaDays, pricePaise: 0 });
  }

  options.push({
    id: "sr_standard",
    name: `Standard delivery (${cheapest.courierName})`,
    etaDays: cheapest.etaDays,
    pricePaise: cheapest.ratePaise,
  });

  // Offer express only when a genuinely faster courier exists at a different price.
  if (fastest.etaDays < cheapest.etaDays && fastest.ratePaise !== cheapest.ratePaise) {
    options.push({
      id: "sr_express",
      name: `Express delivery (${fastest.courierName})`,
      etaDays: fastest.etaDays,
      pricePaise: fastest.ratePaise,
    });
  }

  return options;
}
