"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

interface CheckResult {
  ok: boolean;
  etaDays: number;
  codAvailable: boolean;
}

function mockServiceability(pincode: string): CheckResult {
  const firstDigit = pincode[0] ?? "0";
  const etaByDigit: Record<string, number> = {
    "1": 5,
    "2": 4,
    "3": 4,
    "4": 5,
    "5": 6,
    "6": 6,
    "7": 7,
    "8": 7,
    "9": 4,
    "0": 5,
  };
  return {
    ok: true,
    etaDays: etaByDigit[firstDigit] ?? 5,
    codAvailable: !["5", "6"].includes(firstDigit),
  };
}

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setError(null);
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a 6-digit pincode.");
      return;
    }
    setResult(mockServiceability(pincode));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-700">
        Check delivery
      </span>
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="6-digit pincode"
          className="flex-1 rounded-sm border border-ink-500/30 bg-bg-elevated px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
        >
          Check
        </button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
      {result && (
        <div
          className={clsx(
            "mt-1 flex items-start gap-2 rounded-sm border p-3 text-sm",
            "border-success/30 bg-success/5 text-success",
          )}
        >
          <Truck className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5 text-ink-700">
            <span className="font-medium text-ink-900">
              Delivery in {result.etaDays} business days
            </span>
            <span className="text-xs">
              {result.codAvailable
                ? "Cash on delivery available"
                : "Online prepaid only at this pincode"}
            </span>
          </div>
        </div>
      )}
    </form>
  );
}
