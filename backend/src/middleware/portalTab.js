// Every browser tab of the portal is bound to the one account it signed in with. The frontend sends that
// binding on each request, so a tab can only use the session of its own role and its own account, even though
// citizens, officers and admins share the browser's cookie jar when they work side by side.
export const PORTAL_ROLES = ['citizen', 'officer', 'admin'];

/** { role, subject } announced by the calling tab; both null for non-browser clients that send neither. */
export function portalTab(req) {
  const role = String(req.headers?.['x-portal-role'] || '').toLowerCase() || null;
  const subject = String(req.headers?.['x-portal-subject'] || '') || null;
  return { role, subject };
}

export const sessionSwitched = (res) =>
  res.status(401).json({
    success: false,
    code: 'SESSION_SWITCHED',
    message: 'Another account signed in from this browser. Please log in again in this tab.',
  });
