import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config.js';

// Reads "Authorization: Bearer <token>", checks the signature and expiry,
// and puts the user's id on req.userId. Every route after this only ever
// queries documents with that userId, so one user can never see another's data.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Please log in' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (!mongoose.isValidObjectId(payload.sub)) throw new Error('bad subject');
    req.userId = new mongoose.Types.ObjectId(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}
