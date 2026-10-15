import { env } from '../config/env.js';
import { signStaffToken, verifyStaffToken } from '../utils/token.js';
import { portalTab, sessionSwitched } from './portalTab.js';

// One cookie per staff role, so an officer and an admin can be signed in side by side in the same browser.
// Both are separate from the citizen "session" cookie. No maxAge: the cookie ends with the browser session,
// and the token itself still expires after 12 hours.
const STAFF_COOKIES = { officer: 'officer_session', admin: 'admin_session' };
const LEGACY_STAFF_COOKIE = 'staff_session';

export function setStaffSession(res, { id, role, department = null }) {
  res.cookie(STAFF_COOKIES[role], signStaffToken({ id, role, department }), env.cookie);
}

export function clearStaffSession(res, role) {
  res.clearCookie(STAFF_COOKIES[role], env.cookie);
  res.clearCookie(LEGACY_STAFF_COOKIE, env.cookie);
}

function staffPayload(req, role) {
  try {
    const payload = verifyStaffToken(req.cookies?.[STAFF_COOKIES[role]]);
    return payload.role === role ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Allows the request only for a staff session whose role is in `roles`; sets req.staff.
 * A portal tab names its role (X-Portal-Role) and account (X-Portal-Subject): a citizen tab never reaches staff
 * routes, and a tab whose account was replaced by a later login in another tab is asked to log in again.
 */
export function requireStaff(...roles) {
  return (req, res, next) => {
    const tab = portalTab(req);
    if (tab.role && !roles.includes(tab.role)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
    }

    const candidates = tab.role ? [tab.role] : roles;
    let payload = null;
    for (const role of candidates) {
      payload = staffPayload(req, role);
      if (payload) break;
    }
    if (!payload) return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    if (tab.subject && tab.subject !== String(payload.sub)) return sessionSwitched(res);

    req.staff = { id: payload.sub, role: payload.role, department: payload.department || null };
    next();
  };
}
