import rateLimit from 'express-rate-limit';

// Slows down password guessing: at most 10 login/register attempts
// per IP address every 15 minutes.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in a few minutes' },
  // The API tests log in many times in a row from one address.
  skip: () => process.env.NODE_ENV === 'test',
});
