import { toPaise } from './money.js';
import { parseDay, isValidMonth } from './dates.js';
import { CATEGORIES, TYPES } from './categories.js';

// Each function returns { value, errors }. `errors` maps a field name to a
// message, and is empty when the input is valid. Validation runs on the server
// even though the form also checks, because anyone can call the API directly.

export function validateTransaction(body = {}) {
  const errors = {};

  const type = body.type;
  if (!TYPES.includes(type)) errors.type = 'Type must be income or expense';

  const amountPaise = toPaise(body.amount);
  if (amountPaise === null) errors.amount = 'Amount must be a positive number with at most 2 decimals';

  const date = parseDay(body.date);
  if (!date) errors.date = 'Date must be a real day in YYYY-MM-DD format';

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) errors.description = 'Description is required';
  else if (description.length > 200) errors.description = 'Description must be at most 200 characters';

  const category = body.category;
  if (!CATEGORIES.includes(category)) errors.category = 'Unknown category';

  return {
    value: { type, amountPaise, date, description, category },
    errors,
  };
}

export function validateBudget(body = {}) {
  const errors = {};

  const category = body.category;
  if (!CATEGORIES.includes(category)) errors.category = 'Unknown category';

  const amountPaise = toPaise(body.amount);
  if (amountPaise === null) errors.amount = 'Amount must be a positive number with at most 2 decimals';

  const month = body.month;
  if (!isValidMonth(month)) errors.month = 'Month must be in YYYY-MM format';

  return { value: { category, amountPaise, month }, errors };
}

export function validateCredentials(body = {}, { requireName = false } = {}) {
  const errors = {};

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (password.length > 72) errors.password = 'Password must be at most 72 characters'; // bcrypt limit

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (requireName && !name) errors.name = 'Name is required';

  return { value: { email, password, name }, errors };
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
