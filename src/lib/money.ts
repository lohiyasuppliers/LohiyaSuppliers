/** All monetary values are stored as integer paise (1 INR = 100 paise). */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatPaise(paise: number, symbol = "₹"): string {
  const rupees = paiseToRupees(paise);
  return `${symbol}${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function applyPercentageDiscountPaise(amountPaise: number, bps: number): number {
  return Math.round((amountPaise * bps) / 10000);
}

export function applyFixedDiscountPaise(amountPaise: number, discountPaise: number): number {
  return Math.max(0, amountPaise - discountPaise);
}

export function calculatePercentageCashbackPaise(amountPaise: number, bps: number): number {
  return Math.round((amountPaise * bps) / 10000);
}
