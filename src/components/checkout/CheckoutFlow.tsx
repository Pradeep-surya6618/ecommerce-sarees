"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, MapPin, Plus, ShoppingBag, Sparkles, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getShippingOptions } from "@/lib/cart/shipping";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { placeOrderAction } from "@/server/actions/orders";
import { Container } from "@/components/ui/Container";
import type {
  Address,
  Cart,
  PaymentMethod,
  SavedAddress,
  ShippingOption,
  ShippingSettings,
} from "@/types/domain";
import { AddressForm, type AddressFormValues } from "./AddressForm";
import { CheckoutStepper, type CheckoutStepId } from "./CheckoutStepper";
import { CheckoutSummary } from "./CheckoutSummary";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { SavedAddressPicker } from "./SavedAddressPicker";
import { ShippingOptionPicker } from "./ShippingOptionPicker";

export interface CheckoutFlowProps {
  cart: Cart;
  savedAddresses: SavedAddress[];
  shippingRates: ShippingSettings;
}

function toAddressFormValues(a: SavedAddress | Address): AddressFormValues {
  return {
    fullName: a.fullName,
    phone: a.phone,
    email: a.email,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
  };
}

export function CheckoutFlow({ cart, savedAddresses, shippingRates }: CheckoutFlowProps) {
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  const shippingOptions = getShippingOptions(subtotalPaise, shippingRates);

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;

  const [step, setStep] = useState<CheckoutStepId>("address");
  const [completed, setCompleted] = useState<CheckoutStepId[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  // When the user has saved addresses, default to "picker" mode showing them.
  const [addressMode, setAddressMode] = useState<"picker" | "form">(
    savedAddresses.length > 0 ? "picker" : "form",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress?.id ?? null,
  );
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

  function continueFromPicker() {
    const saved = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!saved) {
      toast.error("Please choose an address.");
      return;
    }
    setAddress({
      fullName: saved.fullName,
      phone: saved.phone,
      email: saved.email,
      line1: saved.line1,
      line2: saved.line2,
      city: saved.city,
      state: saved.state,
      pincode: saved.pincode,
      country: "IN",
    });
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
        // placeOrderAction calls `redirect()` on success, which throws
        // NEXT_REDIRECT. Toast first so the user sees confirmation even though
        // the success page itself is also a clear success state.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          toast.success("Order placed!");
          return;
        }
        toast.error("Couldn't place order. Please try again.");
        console.error(err);
      }
    });
  }

  // Pre-fill the form with the selected saved address when switching to form mode.
  const selectedSaved = savedAddresses.find((a) => a.id === selectedAddressId);
  const formDefaults: Partial<AddressFormValues> | undefined =
    addressMode === "form" && selectedSaved ? toAddressFormValues(selectedSaved) : undefined;

  return (
    <Container size="xl" className="px-4! py-5 sm:px-6! sm:py-8 md:px-8! md:py-10">
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          <Sparkles className="h-3 w-3" />
          Almost there
        </span>
        <h1 className="font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
          Checkout
        </h1>
      </header>

      {/* ── Stepper ── */}
      <div className="mt-4 sm:mt-6">
        <CheckoutStepper current={step} completed={completed} />
      </div>

      <div className="mt-5 grid gap-5 sm:mt-7 sm:gap-7 md:mt-8 md:grid-cols-[2fr_1fr] md:gap-8">
        <div className="order-2 flex min-w-0 flex-col gap-5 sm:gap-7 md:order-none">
          {/* ── ADDRESS STEP ── */}
          {step === "address" && (
            <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <SectionHeader
                eyebrow="Step 1"
                title="Delivery address"
                icon={MapPin}
                action={
                  savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddressMode((m) => (m === "picker" ? "form" : "picker"))}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700 transition hover:border-accent-primary hover:text-accent-primary sm:text-[11px]"
                    >
                      {addressMode === "picker" ? (
                        <>
                          <Plus className="h-3 w-3" />
                          Add new
                        </>
                      ) : (
                        <>
                          <ChevronLeft className="h-3 w-3" />
                          Saved addresses
                        </>
                      )}
                    </button>
                  )
                }
              />

              {addressMode === "picker" && savedAddresses.length > 0 ? (
                <>
                  <SavedAddressPicker
                    addresses={savedAddresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                    onAddNew={() => setAddressMode("form")}
                  />
                  <div className="mt-5 flex justify-end sm:mt-7">
                    <button
                      type="button"
                      onClick={continueFromPicker}
                      className="group relative inline-flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-accent-primary px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-accent-primary-hover sm:h-11 sm:px-6 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1 bg-accent-gold transition-all group-hover:w-1.5 sm:w-1.5 sm:group-hover:w-2"
                      />
                      Continue to shipping
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <AddressForm
                    defaultValues={
                      formDefaults ?? (address ? toAddressFormValues(address) : undefined)
                    }
                    onSubmit={onAddressSubmit}
                    formId="address-form"
                  />
                  <div className="mt-5 flex justify-end sm:mt-7">
                    <button
                      type="submit"
                      form="address-form"
                      className="group relative inline-flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-accent-primary px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-accent-primary-hover sm:h-11 sm:px-6 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1 bg-accent-gold transition-all group-hover:w-1.5 sm:w-1.5 sm:group-hover:w-2"
                      />
                      Continue to shipping
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── SHIPPING STEP ── */}
          {step === "shipping" && (
            <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <SectionHeader eyebrow="Step 2" title="Shipping" icon={Truck} />
              <ShippingOptionPicker
                options={shippingOptions}
                selectedId={shippingOption?.id ?? null}
                onChange={setShippingOption}
              />
              <StepActions
                onBack={() => setStep("address")}
                onNext={onShippingNext}
                nextLabel="Continue to payment"
              />
            </section>
          )}

          {/* ── PAYMENT STEP ── */}
          {step === "payment" && (
            <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <SectionHeader eyebrow="Step 3" title="Payment" icon={Wallet} />
              <PaymentMethodPicker selected={paymentMethod} onChange={setPaymentMethod} />
              <StepActions
                onBack={() => setStep("shipping")}
                onNext={onPlaceOrder}
                nextLabel={pending ? "Placing order…" : "Place order"}
                nextIcon={<ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                disabled={pending}
              />
            </section>
          )}
        </div>

        <div className="order-1 md:sticky md:top-24 md:order-none md:self-start">
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

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  icon: typeof MapPin;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
            {eyebrow}
          </span>
          <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl md:text-2xl">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </header>
  );
}

function StepActions({
  onBack,
  onNext,
  nextLabel,
  nextIcon,
  disabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink-500/20 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700 transition hover:border-ink-700 hover:text-ink-900 sm:px-4 sm:py-2 sm:text-[11px]"
      >
        <ChevronLeft className="h-3 w-3" />
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="group relative inline-flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-accent-primary px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-6 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-accent-gold transition-all group-hover:w-1.5 sm:w-1.5 sm:group-hover:w-2"
        />
        {nextIcon}
        {nextLabel}
      </button>
    </div>
  );
}
