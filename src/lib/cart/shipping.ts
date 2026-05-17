import type { ShippingOption } from "@/types/domain";

const FREE_SHIPPING_THRESHOLD_PAISE = 200000; // ₹2,000

export const STANDARD_SHIPPING: ShippingOption = {
  id: "std",
  name: "Standard delivery",
  etaDays: 5,
  pricePaise: 8000,
};

export const EXPRESS_SHIPPING: ShippingOption = {
  id: "exp",
  name: "Express delivery",
  etaDays: 2,
  pricePaise: 20000,
};

export const FREE_SHIPPING: ShippingOption = {
  id: "free",
  name: "Free shipping",
  etaDays: 7,
  pricePaise: 0,
};

export function getShippingOptions(subtotalPaise: number): ShippingOption[] {
  const opts: ShippingOption[] = [STANDARD_SHIPPING, EXPRESS_SHIPPING];
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE) {
    return [FREE_SHIPPING, ...opts];
  }
  return opts;
}
