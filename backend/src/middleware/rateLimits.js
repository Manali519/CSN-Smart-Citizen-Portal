import rateLimit from 'express-rate-limit';

/**
 * Rate limiter keyed by an account identifier (email, officer ID, user ID) rather than the client IP.
 * Behind the frontend's Vercel /api rewrite every request reaches the backend from Vercel's proxy, which
 * overwrites X-Forwarded-For, so an IP-keyed limit would be shared by all citizens at once.
 * Counters live in memory per function instance.
 */
export function limitBy(key, { windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${key(req) || ''}`.trim().toLowerCase().slice(0, 254) || 'anonymous',
    message: { success: false, code: 'RATE_LIMITED', message },
  });
}

export const byEmail = (req) => req.body?.email;
export const byUser = (req) => req.user?._id;
