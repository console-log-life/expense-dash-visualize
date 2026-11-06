const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 12550 -> "₹125.50", 1234567 -> "₹12,345.67" (Indian digit grouping).
// Dividing by 100 here is only for display; all sums happen in integer paise.
export function formatINR(paise: number) {
  return inr.format(paise / 100);
}

// Short form for chart axes: 150000 paise -> "₹1.5K".
export function formatINRShort(paise: number) {
  const rupees = paise / 100;
  if (Math.abs(rupees) >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (Math.abs(rupees) >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

// 12550 -> "125.50", for putting an amount back into an input box.
export function paiseToInput(paise: number) {
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
}

export function formatMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Today's date / month in the user's own time zone, as "YYYY-MM-DD" / "YYYY-MM".
export function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function thisMonth() {
  return today().slice(0, 7);
}
