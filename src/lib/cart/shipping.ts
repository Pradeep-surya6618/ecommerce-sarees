import type { ShippingOption, ShippingSettings } from "@/types/domain";

// ETA windows stay fixed in code — the admin tunes prices + the free-shipping
// threshold, not delivery speed (which is a courier concern, not a setting).
const STANDARD_ETA_DAYS = 5;
const EXPRESS_ETA_DAYS = 2;
const FREE_ETA_DAYS = 7;

// Fallback rates if settings haven't loaded — match the historical constants
// (₹2,000 / ₹80 / ₹200) so callers without settings still behave sensibly.
export const DEFAULT_SHIPPING_RATES: ShippingSettings = {
  freeShippingThresholdPaise: 200000,
  standardRatePaise: 8000,
  expressRatePaise: 20000,
};

// Builds the shipping options the customer can pick from, given the cart
// subtotal and the store's configured rates. Free shipping unlocks once the
// subtotal reaches the threshold. Pure + deterministic so the server can
// re-derive the same options to validate the customer's choice.
export function getShippingOptions(
  subtotalPaise: number,
  rates: ShippingSettings = DEFAULT_SHIPPING_RATES,
): ShippingOption[] {
  const standard: ShippingOption = {
    id: "std",
    name: "Standard delivery",
    etaDays: STANDARD_ETA_DAYS,
    pricePaise: rates.standardRatePaise,
  };
  const express: ShippingOption = {
    id: "exp",
    name: "Express delivery",
    etaDays: EXPRESS_ETA_DAYS,
    pricePaise: rates.expressRatePaise,
  };
  if (subtotalPaise >= rates.freeShippingThresholdPaise) {
    const free: ShippingOption = {
      id: "free",
      name: "Free shipping",
      etaDays: FREE_ETA_DAYS,
      pricePaise: 0,
    };
    return [free, standard, express];
  }
  return [standard, express];
}
