"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, MapPin, Plus, ShoppingBag, Sparkles, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getShippingOptions } from "@/lib/cart/shipping";
import { computeSubtotalPaise, computeTaxPaise, computeTotalPaise } from "@/lib/cart/totals";
import { createAddressAction } from "@/server/actions/addresses";
import { placeOrderAction, verifyRazorpayPaymentAction } from "@/server/actions/orders";
import { getShippingRatesAction } from "@/server/actions/shipping";
import { Container } from "@/components/ui/Container";
import type {
  Address,
  Cart,
  PaymentMethod,
  SavedAddress,
  ShippingOption,
  ShippingSettings,
} from "@/types/domain";
import { AddressForm, type AddressFormValues, type AddressSubmitOptions } from "./AddressForm";
import { CheckoutStepper, type CheckoutStepId } from "./CheckoutStepper";
import { CheckoutSubmittingOverlay, type SubmittingPhase } from "./CheckoutSubmittingOverlay";
import { CheckoutSummary } from "./CheckoutSummary";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { SavedAddressPicker } from "./SavedAddressPicker";
import { ShippingOptionPicker } from "./ShippingOptionPicker";

export interface CheckoutFlowProps {
  cart: Cart;
  savedAddresses: SavedAddress[];
  shippingRates: ShippingSettings;
  /** Signed-in customers can save a new address to their account. */
  isSignedIn: boolean;
}

// ── Razorpay client helpers (kept inline — only this component uses them) ──

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill: { name: string; email: string; contact: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
  theme?: { color: string };
}

// Razorpay's checkout.js attaches a constructor to window.Razorpay. We only
// need the surface area we actually call.
type RazorpayCtor = new (options: RazorpayOptions) => { open: () => void };
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("not in browser"));
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Failed to load Razorpay checkout."));
    };
    document.head.appendChild(s);
  });
  return razorpayScriptPromise;
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

export function CheckoutFlow({
  cart,
  savedAddresses,
  shippingRates,
  isSignedIn,
}: CheckoutFlowProps) {
  const subtotalPaise = computeSubtotalPaise(cart.items);
  const taxPaise = computeTaxPaise(subtotalPaise);
  // Flat options serve as the immediate default + the fallback if the live
  // rate fetch fails. Once we know the delivery pincode we replace them with
  // Shiprocket's live courier quotes.
  const flatOptions = getShippingOptions(subtotalPaise, shippingRates);

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
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(flatOptions);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(
    flatOptions[0] ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [pending, startTransition] = useTransition();
  // Drives the full-page veil that covers checkout while the server does its
  // thing (placing the order, or verifying a Razorpay signature). We hide it
  // while the Razorpay modal is open — that modal has its own backdrop, ours
  // would just double up. The overlay also stays up through the
  // success-page navigation, so the user never sees a bare checkout flash.
  const [submitting, setSubmitting] = useState<SubmittingPhase | null>(null);

  // Fetch live courier rates for a pincode and swap them in. Falls back to the
  // flat options already in state if the fetch errors. Called when the address
  // step completes (that's when we first know where it's shipping).
  function loadRatesFor(pincode: string) {
    setRatesLoading(true);
    void getShippingRatesAction({ deliveryPincode: pincode, paymentMethod })
      .then((result) => {
        if (result.ok && result.options.length > 0) {
          setShippingOptions(result.options);
          setShippingOption(result.options[0] ?? null);
        }
      })
      .finally(() => setRatesLoading(false));
  }

  const shippingPaise = shippingOption?.pricePaise ?? 0;
  const totalPaise = computeTotalPaise({ subtotalPaise, taxPaise, shippingPaise });

  function onAddressSubmit(values: Address, opts: AddressSubmitOptions) {
    setAddress(values);
    setCompleted((c) => Array.from(new Set([...c, "address"])));
    loadRatesFor(values.pincode);
    setStep("shipping");

    // Optionally persist the new address to the account — fire-and-forget so
    // it doesn't block the checkout flow. Toast either way per the app's
    // every-action-toasts rule.
    if (opts.saveToAccount && isSignedIn) {
      void createAddressAction({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        line1: values.line1,
        line2: values.line2 ?? "",
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        country: "IN",
      })
        .then(() => toast.success("Address saved to your account"))
        .catch(() => toast.error("Couldn't save the address, but your order can still proceed."));
    }
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
    loadRatesFor(saved.pincode);
    setStep("shipping");
  }

  // Open a blank "add new address" form. Clears any previously picked/entered
  // address so the form never inherits the selected saved address.
  function startAddNew() {
    setAddress(null);
    setAddressMode("form");
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
    setSubmitting("placing");
    startTransition(async () => {
      try {
        const result = await placeOrderAction({
          shippingAddress: address,
          shippingOption,
          paymentMethod,
        });
        // COD path: placeOrderAction calls redirect() (throws NEXT_REDIRECT)
        // before this point — handled in the catch below. So if we reach here,
        // we got a Razorpay payload (or an error).
        if (!result.ok) {
          setSubmitting(null);
          toast.error("Couldn't place order", { description: result.error });
          return;
        }
        if (result.kind === "razorpay") {
          await openRazorpayModal(result);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          // Keep the overlay up; the success page is about to take over.
          toast.success("Order placed!");
          return;
        }
        setSubmitting(null);
        toast.error("Couldn't place order. Please try again.");
        console.error(err);
      }
    });
  }

  // Loads Razorpay's checkout.js (once) and opens the modal. On a successful
  // payment, calls verifyRazorpayPaymentAction which signature-checks the
  // response server-side and redirects to the success page.
  async function openRazorpayModal(payload: {
    orderId: string;
    razorpayOrderId: string;
    keyId: string;
    amountPaise: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
  }) {
    try {
      await loadRazorpayScript();
    } catch {
      setSubmitting(null);
      toast.error("Couldn't open the payment window. Please try again.");
      return;
    }
    if (!window.Razorpay) {
      setSubmitting(null);
      toast.error("Payment library failed to load.");
      return;
    }
    const rzp = new window.Razorpay({
      key: payload.keyId,
      amount: payload.amountPaise,
      currency: payload.currency,
      order_id: payload.razorpayOrderId,
      name: "Saree Store",
      description: `Order ${payload.orderId}`,
      prefill: {
        name: payload.customerName,
        email: payload.customerEmail,
        contact: payload.customerPhone,
      },
      handler: (response) => {
        // Modal just closed; raise our own overlay over the bare checkout
        // while we verify the signature server-side and the redirect lands.
        setSubmitting("verifying");
        // The handler can't be async, so kick off the verify in a transition.
        startTransition(async () => {
          try {
            await verifyRazorpayPaymentAction({
              orderId: payload.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err) {
            if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
              // Keep the overlay up; the success page is about to take over.
              toast.success("Payment received!");
              return;
            }
            setSubmitting(null);
            toast.error("Payment couldn't be verified", {
              description: err instanceof Error ? err.message : undefined,
            });
          }
        });
      },
      modal: {
        ondismiss: () => {
          // User closed the Razorpay window without paying — drop the overlay
          // so they're back on checkout. (Handler didn't fire, so verifying
          // never started.)
          setSubmitting(null);
          toast.message("Payment cancelled. You can try again or pick COD.");
        },
      },
      theme: { color: "#5b3a8a" },
    });
    // Razorpay's modal has its own backdrop; ours would just double up. Drop
    // our overlay the moment the modal mounts.
    setSubmitting(null);
    rzp.open();
  }

  // "Add new" must open a blank form — never pre-filled with a saved address.
  // We only restore values the customer typed themselves this session (held in
  // `address` after they submit), so hitting Back from the shipping step keeps
  // their entry. A freshly-picked saved address shouldn't leak into the form.
  const formDefaults: Partial<AddressFormValues> | undefined =
    addressMode === "form" && address ? toAddressFormValues(address) : undefined;

  return (
    <Container size="xl" className="px-4! py-5 sm:px-6! sm:py-8 md:px-8! md:py-10">
      <CheckoutSubmittingOverlay phase={submitting} />

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
                      onClick={() =>
                        addressMode === "picker" ? startAddNew() : setAddressMode("picker")
                      }
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
                    onAddNew={startAddNew}
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
                    showSaveOption={isSignedIn}
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
              {ratesLoading ? (
                <p className="py-4 text-sm text-ink-500">Fetching live delivery rates…</p>
              ) : (
                <ShippingOptionPicker
                  options={shippingOptions}
                  selectedId={shippingOption?.id ?? null}
                  onChange={setShippingOption}
                />
              )}
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
