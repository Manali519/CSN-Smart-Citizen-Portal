import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Environment comes from the Vercel project settings in production and from backend/.env locally.
// backend/.env is loaded by absolute path, so it is found whatever folder the server is started from (backend/,
// the project root, an IDE run button). Variables already set (Vercel settings, the shell) are not overwritten.
const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
if (!process.env.VERCEL && existsSync(envFile)) process.loadEnvFile(envFile);

// Values pasted into the Vercel dashboard often keep the quotes or a trailing newline from a .env file.
const clean = (value) => value?.trim().replace(/^(['"])(.*)\1$/, '$2').trim();

function required(name) {
  const value = clean(process.env[name]);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set it in the Vercel project settings (Production environment) and redeploy, or add it to backend/.env for local development.`);
  }
  return value;
}

// Vercel production deployments always run in production mode, even if NODE_ENV=development was copied from a local .env.
const nodeEnv = process.env.VERCEL_ENV === 'production' ? 'production' : process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// The frontend proxies /api to this Vercel project (frontend/vercel.json), so auth cookies are first-party and
// SameSite=Lax works. Use COOKIE_SAMESITE=none only if the browser calls the API on another site directly.
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAMESITE must be lax, strict or none.');
}

export const env = {
  nodeEnv,
  // Number of reverse proxies in front of the API (e.g. 1 on Vercel or behind nginx). Needed so rate limits
  // see the real client IP; leave 0 when the API is reached directly, or clients could spoof their IP.
  // Vercel (which sets VERCEL=1) always sits behind its edge network, which overwrites X-Forwarded-For.
  trustProxy: Number(process.env.TRUST_PROXY || (process.env.VERCEL ? 1 : 0)),
  // Shared by every auth cookie; clearCookie needs the same attributes or browsers keep the cookie.
  cookie: { httpOnly: true, secure: isProd || sameSite === 'none', sameSite },
  port: Number(process.env.PORT || 5000),
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, '')) // browsers send the Origin without a trailing slash
    .filter(Boolean),

  mongodbUri: required('MONGODB_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  googleClientId: required('GOOGLE_CLIENT_ID'),

  smtp: {
    host: required('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    fromName: process.env.MAIL_FROM_NAME || 'Smart City Portal',
  },

  otp: {
    length: Number(process.env.OTP_LENGTH || 6),
    expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60),
  },

  // Optional: the API boots without these; payment routes answer 503 until both are set.
  razorpay: {
    keyId: (process.env.RAZORPAY_KEY_ID || '').trim(),
    keySecret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
    currency: 'INR',
  },
};

if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}
