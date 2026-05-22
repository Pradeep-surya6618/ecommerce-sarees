"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgePercent,
  Calendar,
  FileText,
  Hash,
  IndianRupee,
  Percent,
  Sparkles,
  Tag,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { paiseToRupees } from "@/lib/money";
import { clsx } from "@/lib/utils/clsx";
import {
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from "@/server/actions/admin-coupons";
import {
  FormSection,
  PillField,
  PillInput,
  PillListbox,
  PillSubmitButton,
} from "@/components/account/AccountFields";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Coupon } from "@/types/domain";

const optionalNumber = z.preprocess(
  (v) => (typeof v === "number" && isNaN(v) ? undefined : v),
  z.number().nonnegative("Must be 0 or more").optional(),
);

const optionalInt = z.preprocess(
  (v) => (typeof v === "number" && isNaN(v) ? undefined : v),
  z.number().int("Must be a whole number").nonnegative("Must be 0 or more").optional(),
);

const couponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  type: z.enum(["percent", "flat"]),
  value: z.number().nonnegative("Must be 0 or more"),
  minOrderRupees: optionalNumber,
  maxDiscountRupees: optionalNumber,
  maxUses: optionalInt,
  validFrom: z.string().min(1, "Valid from date is required"),
  validTo: z.string().min(1, "Valid to date is required"),
  status: z.enum(["active", "paused"]),
});

type CouponFormValues = z.output<typeof couponSchema>;

export interface CouponFormProps {
  editCode?: string;
  defaultCoupon?: Coupon;
}

function toDateInputValue(isoString: string): string {
  return isoString.slice(0, 10);
}

/** Random readable code: "SAREE-" prefix + 6 chars. Ambiguous letters (I, O)
 *  and digits (0, 1) are excluded so users don't mistype when reading it back. */
function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SAREE-${suffix}`;
}

export function CouponForm({ editCode, defaultCoupon }: CouponFormProps) {
  const [isPending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: defaultCoupon?.code ?? "",
      description: defaultCoupon?.description ?? "",
      type: defaultCoupon?.type ?? "percent",
      value: defaultCoupon?.value ?? 0,
      minOrderRupees:
        defaultCoupon?.minOrderPaise != null
          ? paiseToRupees(defaultCoupon.minOrderPaise)
          : undefined,
      maxDiscountRupees:
        defaultCoupon?.maxDiscountPaise != null
          ? paiseToRupees(defaultCoupon.maxDiscountPaise)
          : undefined,
      maxUses: defaultCoupon?.maxUses,
      validFrom: defaultCoupon ? toDateInputValue(defaultCoupon.validFrom) : "",
      validTo: defaultCoupon ? toDateInputValue(defaultCoupon.validTo) : "",
      status: defaultCoupon?.status ?? "active",
    },
  });

  const couponType = watch("type");

  async function onSubmit(values: CouponFormValues) {
    const validFromIso = `${values.validFrom}T00:00:00.000Z`;
    const validToIso = `${values.validTo}T23:59:59.999Z`;

    const minOrderPaise =
      values.minOrderRupees != null && !isNaN(values.minOrderRupees)
        ? Math.round(values.minOrderRupees * 100)
        : undefined;
    const maxDiscountPaise =
      values.maxDiscountRupees != null && !isNaN(values.maxDiscountRupees)
        ? Math.round(values.maxDiscountRupees * 100)
        : undefined;

    const valueStored = values.type === "flat" ? Math.round(values.value * 100) : values.value;

    const input = {
      code: values.code.toUpperCase().trim(),
      description: values.description || undefined,
      type: values.type,
      value: valueStored,
      minOrderPaise,
      maxDiscountPaise: values.type === "percent" ? maxDiscountPaise : undefined,
      maxUses: values.maxUses != null && !isNaN(values.maxUses) ? values.maxUses : undefined,
      validFrom: validFromIso,
      validTo: validToIso,
      status: values.status,
    };

    startTransition(async () => {
      try {
        if (editCode) {
          await updateCouponAction(editCode, input);
          toast.success("Coupon saved");
        } else {
          await createCouponAction(input);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Could not save coupon.");
      }
    });
  }

  function confirmDelete() {
    if (!editCode) return;
    startDeleting(async () => {
      try {
        await deleteCouponAction(editCode);
        toast.success("Coupon deleted", {
          description: `"${editCode}" has been removed.`,
        });
        setConfirmOpen(false);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setConfirmOpen(false);
        toast.error(err instanceof Error ? err.message : "Could not delete coupon.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-7">
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Coupon details" hint="What customers will type at checkout.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField
              label="Code"
              htmlFor="code"
              required
              hint={editCode ? undefined : "Type your own or tap Generate for a random one."}
              error={errors.code?.message}
            >
              <div
                className={clsx(
                  "flex items-center gap-2 rounded-full border bg-bg-elevated pl-1 pr-1 transition sm:gap-3",
                  editCode && "opacity-60",
                  errors.code
                    ? "border-danger/60 focus-within:border-danger"
                    : "border-ink-500/20 focus-within:border-accent-primary",
                )}
              >
                <span
                  className={clsx(
                    "pointer-events-none inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10",
                    errors.code
                      ? "bg-danger/15 text-danger"
                      : "bg-ink-900/[0.06] text-accent-primary",
                  )}
                >
                  <Tag className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <input
                  id="code"
                  placeholder="SUMMER20"
                  aria-invalid={errors.code ? "true" : undefined}
                  disabled={!!editCode}
                  {...register("code", {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                  style={{ textTransform: "uppercase" }}
                  className="autofill-on-light h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none disabled:cursor-not-allowed sm:h-12 sm:text-base"
                />
                {!editCode && (
                  <button
                    type="button"
                    onClick={() =>
                      setValue("code", generateCouponCode(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    aria-label="Generate random coupon code"
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/[0.06] px-3 text-[10px] font-semibold uppercase tracking-wider text-accent-primary transition hover:border-accent-primary hover:bg-accent-primary/10 sm:h-10 sm:px-3.5 sm:text-[11px]"
                  >
                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Generate
                  </button>
                )}
              </div>
            </PillField>

            <PillField
              label="Description"
              htmlFor="description"
              hint="Optional internal note."
              error={errors.description?.message}
            >
              <PillInput
                id="description"
                icon={FileText}
                placeholder="20% off for summer sale"
                {...register("description")}
              />
            </PillField>
          </div>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Discount" hint="How much customers save.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <PillField label="Type" htmlFor="type" required error={errors.type?.message}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <PillListbox
                    id="type"
                    icon={BadgePercent}
                    value={field.value === "percent" ? "Percent (%)" : "Flat (₹)"}
                    onChange={(label) =>
                      field.onChange(label === "Percent (%)" ? "percent" : "flat")
                    }
                    onBlur={field.onBlur}
                    options={["Percent (%)", "Flat (₹)"]}
                    placeholder="Select type"
                    invalid={!!errors.type}
                  />
                )}
              />
            </PillField>

            <PillField
              label={couponType === "percent" ? "Value (%)" : "Value (₹)"}
              htmlFor="value"
              required
              error={errors.value?.message}
            >
              <PillInput
                id="value"
                icon={couponType === "percent" ? Percent : IndianRupee}
                type="number"
                min={0}
                step={couponType === "percent" ? 1 : 0.01}
                max={couponType === "percent" ? 100 : undefined}
                inputMode="decimal"
                placeholder={couponType === "percent" ? "20" : "500"}
                {...register("value", { valueAsNumber: true })}
                invalid={!!errors.value}
              />
            </PillField>

            <PillField
              label="Min order (₹)"
              htmlFor="minOrderRupees"
              hint="Leave blank for no minimum."
              error={errors.minOrderRupees?.message}
            >
              <PillInput
                id="minOrderRupees"
                icon={IndianRupee}
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                placeholder="2500"
                {...register("minOrderRupees", { valueAsNumber: true })}
                invalid={!!errors.minOrderRupees}
              />
            </PillField>

            {couponType === "percent" && (
              <PillField
                label="Max discount (₹)"
                htmlFor="maxDiscountRupees"
                hint="Cap on discount amount; leave blank for no cap."
                error={errors.maxDiscountRupees?.message}
              >
                <PillInput
                  id="maxDiscountRupees"
                  icon={IndianRupee}
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  placeholder="1000"
                  {...register("maxDiscountRupees", { valueAsNumber: true })}
                  invalid={!!errors.maxDiscountRupees}
                />
              </PillField>
            )}

            <PillField
              label="Max uses"
              htmlFor="maxUses"
              hint="Leave blank for unlimited."
              error={errors.maxUses?.message}
            >
              <PillInput
                id="maxUses"
                icon={Hash}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="100"
                {...register("maxUses", { valueAsNumber: true })}
                invalid={!!errors.maxUses}
              />
            </PillField>
          </div>
        </FormSection>
      </section>

      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <FormSection title="Validity & status" hint="When this coupon works.">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            <PillField
              label="Valid from"
              htmlFor="validFrom"
              required
              error={errors.validFrom?.message}
            >
              <PillInput
                id="validFrom"
                icon={Calendar}
                type="date"
                {...register("validFrom")}
                invalid={!!errors.validFrom}
              />
            </PillField>

            <PillField label="Valid to" htmlFor="validTo" required error={errors.validTo?.message}>
              <PillInput
                id="validTo"
                icon={Calendar}
                type="date"
                {...register("validTo")}
                invalid={!!errors.validTo}
              />
            </PillField>

            <PillField label="Status" htmlFor="status" required error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <PillListbox
                    id="status"
                    icon={ToggleRight}
                    value={field.value === "active" ? "Active" : "Paused"}
                    onChange={(label) => field.onChange(label === "Active" ? "active" : "paused")}
                    onBlur={field.onBlur}
                    options={["Active", "Paused"]}
                    placeholder="Select status"
                    invalid={!!errors.status}
                  />
                )}
              />
            </PillField>
          </div>
        </FormSection>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {editCode ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || isPending}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-danger/30 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-xs sm:tracking-[0.2em] md:h-12 md:text-sm"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {deleting ? "Deleting…" : "Delete coupon"}
          </button>
        ) : (
          <span />
        )}
        <PillSubmitButton
          pending={isPending}
          pendingLabel="Saving…"
          className="self-stretch sm:self-auto"
        >
          {editCode ? "Save changes" : "Create coupon"}
        </PillSubmitButton>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this coupon?"
        description={`"${editCode ?? "Coupon"}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        icon={Trash2}
        pending={deleting}
      />
    </form>
  );
}
