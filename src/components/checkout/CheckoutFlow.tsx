"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getShippingOptions } from "@/lib/cart/shipping";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { placeOrderAction } from "@/server/actions/orders";
import { Container } from "@/components/ui/Container";
import type { Address, Cart, PaymentMethod, ShippingOption } from "@/types/domain";
import { AddressForm, type AddressFormValues } from "./AddressForm";
import { CheckoutStepper, type CheckoutStepId } from "./CheckoutStepper";
import { CheckoutSummary } from "./CheckoutSummary";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { ShippingOptionPicker } from "./ShippingOptionPicker";

export function CheckoutFlow({ cart }: { cart: Cart }) {
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const shippingOptions = getShippingOptions(subtotalPaise);

  const [step, setStep] = useState<CheckoutStepId>("address");
  const [completed, setCompleted] = useState<CheckoutStepId[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(
    shippingOptions[0] ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [pending, startTransition] = useTransition();

  const shippingPaise = shippingOption?.pricePaise ?? 0;
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise });

  function onAddressSubmit(values: AddressFormValues) {
    setAddress({ ...values, country: "IN" });
    setCompleted((c) => Array.from(new Set([...c, "address"])));
    setStep("shipping");
  }

  function onShippingNext() {
    if (!shippingOption) {
      toast.error("Please choose a shipping option.");
      return;
    }
    setCompleted((c) => Array.from(new Set([...c, "shipping"])));
    setStep("payment");
  }

  function onPlaceOrder() {
    if (!address || !shippingOption) {
      toast.error("Please complete address and shipping first.");
      return;
    }
    startTransition(async () => {
      try {
        await placeOrderAction({
          shippingAddress: address,
          shippingOption,
          paymentMethod,
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Couldn't place order. Please try again.");
        console.error(err);
      }
    });
  }

  return (
    <Container size="xl" className="py-6">
      <h1 className="mb-6 font-display text-3xl text-ink-900 md:text-5xl">Checkout</h1>
      <CheckoutStepper current={step} completed={completed} />

      <div className="mt-10 grid gap-12 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-10">
          {step === "address" && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink-900">Delivery address</h2>
              <AddressForm
                defaultValues={address ?? undefined}
                onSubmit={onAddressSubmit}
                formId="address-form"
              />
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  form="address-form"
                  className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
                >
                  Continue to shipping
                </button>
              </div>
            </section>
          )}

          {step === "shipping" && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink-900">Shipping</h2>
              <ShippingOptionPicker
                options={shippingOptions}
                selectedId={shippingOption?.id ?? null}
                onChange={setShippingOption}
              />
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="rounded-sm border border-ink-500/30 px-6 py-3 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onShippingNext}
                  className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
                >
                  Continue to payment
                </button>
              </div>
            </section>
          )}

          {step === "payment" && (
            <section>
              <h2 className="mb-4 font-display text-2xl text-ink-900">Payment</h2>
              <PaymentMethodPicker selected={paymentMethod} onChange={setPaymentMethod} />
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="rounded-sm border border-ink-500/30 px-6 py-3 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onPlaceOrder}
                  disabled={pending}
                  className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? "Placing order…" : "Place order"}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <CheckoutSummary
            cart={cart}
            subtotalPaise={subtotalPaise}
            shippingPaise={shippingPaise}
            taxPaise={taxPaise}
            totalPaise={totalPaise}
          />
        </div>
      </div>
    </Container>
  );
}
