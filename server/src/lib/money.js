// All money is stored as an integer number of paise (1 rupee = 100 paise).
// Floating point numbers cannot represent most decimal amounts exactly
// (0.1 + 0.2 !== 0.3), so adding many float amounts slowly drifts away from
// the real total. Integers add up exactly.

// Largest single amount we accept: 1 crore rupees (10,000,000 rupees).
export const MAX_PAISE = 10_000_000 * 100;

// Turns user input such as "125.5", "1,250.75" or 99 into paise.
// Works on the text form of the number and never multiplies a float by 100,
// because 1.15 * 100 === 114.99999999999999 in JavaScript.
// Returns null when the input is not a valid positive amount.
export function toPaise(input) {
  if (input === null || input === undefined) return null;
  const text = String(input).trim().replace(/,/g, '');
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;

  const rupees = Number(match[1]);
  const fraction = (match[2] || '').padEnd(2, '0');
  const paise = rupees * 100 + Number(fraction);

  if (paise <= 0 || paise > MAX_PAISE) return null;
  return paise;
}

// Turns paise back into a plain decimal string, e.g. 12550 -> "125.50".
export function paiseToString(paise) {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}${rupees}.${rest}`;
}
