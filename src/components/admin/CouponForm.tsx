"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { paiseToRupees } from "@/lib/money";
import {
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from "@/server/actions/admin-coupons";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Coupon } from "@/types/domain";

const couponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  type: z.enum(["percent", "flat"]),
  value: z.number().nonnegative("Must be 0 or more"),
  minOrderRupees: z.number().nonnegative("Must be 0 or more").optional(),
  maxDiscountRupees: z.number().nonnegative("Must be 0 or more").optional(),
  maxUses: z.number().int("Must be a whole number").nonnegative("Must be 0 or more").optional(),
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
  // ISO string -> YYYY-MM-DD for <input type="date">
  return isoString.slice(0, 10);
}

export function CouponForm({ editCode, defaultCoupon }: CouponFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
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
    // Convert date inputs to ISO datetime strings
    const validFromIso = `${values.validFrom}T00:00:00.000Z`;
    const validToIso = `${values.validTo}T23:59:59.999Z`;

    // Convert rupee fields to paise
    const minOrderPaise =
      values.minOrderRupees != null && !isNaN(values.minOrderRupees)
        ? Math.round(values.minOrderRupees * 100)
        : undefined;
    const maxDiscountPaise =
      values.maxDiscountRupees != null && !isNaN(values.maxDiscountRupees)
        ? Math.round(values.maxDiscountRupees * 100)
        : undefined;

    // For flat coupons, value is in rupees (needs conversion to paise)
    // For percent, value is a percentage (0–100), no conversion
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
          // createCouponAction redirects; toast fires before NEXT_REDIRECT throws
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Could not save coupon.");
      }
    });
  }

  function handleDelete() {
    if (!editCode) return;
    if (!confirm(`Delete coupon "${editCode}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteCouponAction(editCode);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : "Could not delete coupon.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {/* Code & Description */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Coupon details</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Code" htmlFor="code" required error={errors.code?.message}>
            <Input
              id="code"
              placeholder="e.g. SUMMER20"
              {...register("code", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              style={{ textTransform: "uppercase" }}
              invalid={!!errors.code}
              disabled={!!editCode}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="description"
            hint="Optional internal note"
            error={errors.description?.message}
          >
            <Input
              id="description"
              placeholder="e.g. 20% off for summer sale"
              {...register("description")}
            />
          </FormField>
        </div>
      </section>

      {/* Discount */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Discount</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <FormField label="Type" htmlFor="type" required error={errors.type?.message}>
            <Select id="type" {...register("type")}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </Select>
          </FormField>

          <FormField
            label={couponType === "percent" ? "Value (%)" : "Value (₹)"}
            htmlFor="value"
            required
            error={errors.value?.message}
          >
            <Input
              id="value"
              type="number"
              min={0}
              step={couponType === "percent" ? "1" : "0.01"}
              max={couponType === "percent" ? 100 : undefined}
              {...register("value", { valueAsNumber: true })}
              invalid={!!errors.value}
            />
          </FormField>

          <FormField
            label="Min order (₹)"
            htmlFor="minOrderRupees"
            hint="Leave blank for no minimum"
            error={errors.minOrderRupees?.message}
          >
            <Input
              id="minOrderRupees"
              type="number"
              min={0}
              step="0.01"
              {...register("minOrderRupees", { valueAsNumber: true })}
              invalid={!!errors.minOrderRupees}
            />
          </FormField>

          {couponType === "percent" && (
            <FormField
              label="Max discount (₹)"
              htmlFor="maxDiscountRupees"
              hint="Cap on discount amount; leave blank for no cap"
              error={errors.maxDiscountRupees?.message}
            >
              <Input
                id="maxDiscountRupees"
                type="number"
                min={0}
                step="0.01"
                {...register("maxDiscountRupees", { valueAsNumber: true })}
                invalid={!!errors.maxDiscountRupees}
              />
            </FormField>
          )}

          <FormField
            label="Max uses"
            htmlFor="maxUses"
            hint="Leave blank for unlimited"
            error={errors.maxUses?.message}
          >
            <Input
              id="maxUses"
              type="number"
              min={0}
              step="1"
              {...register("maxUses", { valueAsNumber: true })}
              invalid={!!errors.maxUses}
            />
          </FormField>
        </div>
      </section>

      {/* Validity & Status */}
      <section className="flex flex-col gap-5 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="font-display text-lg text-ink-900">Validity &amp; status</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <FormField
            label="Valid from"
            htmlFor="validFrom"
            required
            error={errors.validFrom?.message}
          >
            <Input
              id="validFrom"
              type="date"
              {...register("validFrom")}
              invalid={!!errors.validFrom}
            />
          </FormField>

          <FormField label="Valid to" htmlFor="validTo" required error={errors.validTo?.message}>
            <Input id="validTo" type="date" {...register("validTo")} invalid={!!errors.validTo} />
          </FormField>

          <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
            <Select id="status" {...register("status")}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </Select>
          </FormField>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-sm bg-accent-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : editCode ? "Save changes" : "Create coupon"}
        </button>
      </div>

      {editCode && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-5">
          <h3 className="mb-1 font-display text-base text-ink-900">Danger zone</h3>
          <p className="mb-3 text-sm text-ink-500">
            Deleting a coupon is permanent and cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-sm border border-danger px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
          >
            Delete coupon
          </button>
        </div>
      )}
    </form>
  );
}
