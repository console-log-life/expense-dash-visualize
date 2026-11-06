// Error with an HTTP status, thrown from route handlers.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Express 4 does not catch errors from async handlers, so each async handler
// is wrapped to pass rejected promises on to the error handler below.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Express recognises an error handler by its four parameters, so `next` must stay.
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id' });
  }
  // Duplicate key from a unique index (e.g. email already registered).
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Already exists' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Something went wrong' });
}
