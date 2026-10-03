import { env } from '../config/env.js';
import { signStaffToken, verifyStaffToken } from '../utils/token.js';

const STAFF_COOKIE = 'staff_session';
const STAFF_SESSION_MS = 12 * 60 * 60 * 1000;

/** Issues the officer/admin session cookie (separate from the citizen "session" cookie). */
export function setStaffSession(res, { id, role, department = null }) {
  res.cookie(STAFF_COOKIE, signStaffToken({ id, role, department }), {
    ...env.cookie,
    maxAge: STAFF_SESSION_MS,
  });
}

export function clearStaffSession(res) {
  res.clearCookie(STAFF_COOKIE, env.cookie);
}

/** Allows the request only for a staff session whose role is in `roles`; sets req.staff. */
export function requireStaff(...roles) {
  return (req, res, next) => {
    let payload;
    try {
      payload = verifyStaffToken(req.cookies?.[STAFF_COOKIE]);
    } catch {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }
    if (!roles.includes(payload.role)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
    }
    req.staff = { id: payload.sub, role: payload.role, department: payload.department || null };
    next();
  };
}
