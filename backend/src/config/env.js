import 'dotenv/config';

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// The frontend proxies /api to this service (frontend/vercel.json), so auth cookies are first-party and
// SameSite=Lax works. Use COOKIE_SAMESITE=none only if the browser calls the API on another site directly.
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAMESITE must be lax, strict or none.');
}

export const env = {
  nodeEnv,
  // Number of reverse proxies in front of the API (e.g. 1 on Cloud Run or behind nginx). Needed so rate limits
  // see the real client IP; leave 0 when the API is reached directly, or clients could spoof their IP.
  // Cloud Run (which sets K_SERVICE) always sits behind Google's front end.
  trustProxy: Number(process.env.TRUST_PROXY || (process.env.K_SERVICE ? 1 : 0)),
  // Shared by every auth cookie; clearCookie needs the same attributes or browsers keep the cookie.
  cookie: { httpOnly: true, secure: isProd || sameSite === 'none', sameSite },
  port: Number(process.env.PORT || 5000),
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
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
