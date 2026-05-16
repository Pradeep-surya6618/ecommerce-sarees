export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

const inrFormatterWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatRupees(paise: number): string {
  const rupees = paiseToRupees(paise);
  const isWhole = Number.isInteger(rupees);
  const formatter = isWhole ? inrFormatterWhole : inrFormatterDecimal;
  // Strip any non-breaking space some ICU builds insert between the symbol and digits.
  return formatter.format(rupees).replace(/\s/g, "");
}
