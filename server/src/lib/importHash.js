import crypto from 'node:crypto';

// A fingerprint of an imported transaction. If the same bank statement is
// uploaded twice, every row produces the same fingerprint as before, and the
// unique index on { userId, importHash } stops it from being saved again.
//
// The description is normalised (lower case, single spaces) so that small
// formatting differences between two exports of the same statement still match.
// `occurrence` separates genuinely repeated rows in one file, for example two
// identical ₹20 tea purchases on the same day: the first gets 1, the second 2.
export function importHash({ date, amountPaise, type, description }, occurrence = 1) {
  const normalised = description.toLowerCase().replace(/\s+/g, ' ').trim();
  const day = date.toISOString().slice(0, 10);
  const key = [day, amountPaise, type, normalised, occurrence].join('|');
  return crypto.createHash('sha256').update(key).digest('hex');
}
