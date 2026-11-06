import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { validateCredentials, hasErrors } from '../lib/validate.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { value, errors } = validateCredentials(req.body, { requireName: true });
    if (hasErrors(errors)) throw new HttpError(400, 'Please fix the highlighted fields', errors);

    const existing = await User.exists({ email: value.email });
    if (existing) throw new HttpError(409, 'An account with this email already exists');

    const passwordHash = await bcrypt.hash(value.password, 10);
    const user = await User.create({ name: value.name, email: value.email, passwordHash });

    res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { value, errors } = validateCredentials(req.body);
    // Same message for every failure, so the response never reveals
    // whether an email is registered.
    const invalid = new HttpError(401, 'Incorrect email or password');
    if (hasErrors(errors)) throw invalid;

    const user = await User.findOne({ email: value.email });
    if (!user) throw invalid;

    const matches = await bcrypt.compare(value.password, user.passwordHash);
    if (!matches) throw invalid;

    res.json({ token: signToken(user._id), user: user.toPublic() });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Please log in');
    res.json({ user: user.toPublic() });
  }),
);

export default router;
