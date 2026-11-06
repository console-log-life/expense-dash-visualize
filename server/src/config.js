// Reads settings from environment variables (see server/.env.example).
// Node 20.6+ can load the .env file itself: `node --env-file=.env src/server.js`.

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of allowed frontend origins, e.g.
  // "http://localhost:8080,https://expense-dash-visualize.vercel.app".
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export function assertConfig() {
  const missing = [];
  if (!config.mongoUri) missing.push('MONGODB_URI');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
