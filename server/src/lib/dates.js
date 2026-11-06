// Dates are kept as calendar days. A transaction dated "2026-11-06" is stored
// as midnight UTC of that day, so the day never shifts with the time zone of
// the server or the browser.

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

// "2026-11-06" -> Date at 2026-11-06T00:00:00Z, or null if not a real day.
export function parseDay(text) {
  const match = DAY_RE.exec(String(text || '').trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects days like 2026-02-31, which Date would roll over into March.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function isValidMonth(text) {
  const match = MONTH_RE.exec(String(text || ''));
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

// "2026-11" -> { start: 2026-11-01, end: 2026-12-01 } (end is exclusive).
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

// Moves a "YYYY-MM" month by a number of months, e.g. ("2026-01", -1) -> "2025-12".
export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return toMonth(date);
}

export function toMonth(date) {
  return date.toISOString().slice(0, 7);
}

export function toDay(date) {
  return date.toISOString().slice(0, 10);
}

export function currentMonth() {
  return toMonth(new Date());
}
