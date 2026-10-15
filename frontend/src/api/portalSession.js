// Tab-bound portal sessions.
//
// Each browser tab is bound to the one account that signed in there (citizen, officer or admin). Every API
// call announces that binding (X-Portal-Role / X-Portal-Subject), so a citizen tab never sees an officer's
// dashboard and vice versa, even when both are signed in side by side in the same browser. A tab that has
// not signed in is a guest.
//
// Leaving the portal ends the tab's session: closing the tab, navigating to another site, or opening the
// portal afresh (anything but a reload) starts as a guest, and any sign-in no other open portal tab is using
// is logged out on the server.

const TAB_KEY = 'portal_tab'; // sessionStorage: { id, role, subject }
const OPEN_TABS_KEY = 'portal_open_tabs'; // localStorage: { [tabId]: { role, at } }
const HEARTBEAT_MS = 10 * 1000;
// Browsers throttle timers in background tabs to about once a minute, so a tab counts as open for longer.
const OPEN_TAB_TTL_MS = 90 * 1000;

export const PORTAL_ROLES = ['citizen', 'officer', 'admin'];

export const LOGIN_PATHS = { citizen: '/citizen-login', officer: '/officer-login', admin: '/admin-login' };

const LOGOUT_PATHS = { citizen: '/api/auth/logout', officer: '/api/officer/logout', admin: '/api/admin/logout' };

function readJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key)) || null;
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode / blocked): the tab simply behaves as a guest after a reload
  }
}

function tabState() {
  let tab = readJson(sessionStorage, TAB_KEY);
  if (!tab?.id) {
    tab = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    writeJson(sessionStorage, TAB_KEY, tab);
  }
  return tab;
}

/** { role, subject } this tab signed in as, or null for a guest tab. */
export function getTabSession() {
  const { role, subject } = tabState();
  return role ? { role, subject } : null;
}

/** Binds this tab to the account that just signed in. */
export function startTabSession(role, subject) {
  writeJson(sessionStorage, TAB_KEY, { id: tabState().id, role, subject: subject ? String(subject) : null });
  heartbeat();
}

/** Returns this tab to guest. */
export function endTabSession() {
  writeJson(sessionStorage, TAB_KEY, { id: tabState().id });
  heartbeat();
}

/** Headers that tell the API which account this tab acts as. */
export function portalHeaders() {
  const session = getTabSession();
  const headers = { 'X-Portal-Role': session?.role || 'guest' };
  if (session?.subject) headers['X-Portal-Subject'] = session.subject;
  return headers;
}

function openTabs() {
  const now = Date.now();
  const tabs = readJson(localStorage, OPEN_TABS_KEY) || {};
  return Object.fromEntries(Object.entries(tabs).filter(([, t]) => now - t.at < OPEN_TAB_TTL_MS));
}

function heartbeat() {
  const { id, role } = tabState();
  writeJson(localStorage, OPEN_TABS_KEY, { ...openTabs(), [id]: { role: role || null, at: Date.now() } });
}

function forgetThisTab() {
  const { id } = tabState();
  const tabs = openTabs();
  delete tabs[id];
  writeJson(localStorage, OPEN_TABS_KEY, tabs);
}

/** Logs out, on the server, every role that no open portal tab is signed in as any more. */
async function logoutUnusedRoles() {
  const { id } = tabState();
  const inUse = new Set(
    Object.entries(openTabs())
      .filter(([tabId]) => tabId !== id)
      .map(([, t]) => t.role)
  );
  const own = getTabSession();
  if (own) inUse.add(own.role);

  const base = import.meta.env.VITE_API_BASE_URL || '';
  await Promise.all(
    PORTAL_ROLES.filter((role) => !inUse.has(role)).map((role) =>
      fetch(`${base}${LOGOUT_PATHS[role]}`, { method: 'POST', credentials: 'include' }).catch(() => {})
    )
  );
}

function isReload() {
  const [nav] = performance.getEntriesByType?.('navigation') || [];
  return nav?.type === 'reload';
}

/** Runs once before the app renders: applies the leave-the-portal logout and starts tracking this tab. */
export async function initPortalSession() {
  if (!isReload()) endTabSession(); // a fresh visit, not a reload: the user left the portal in between
  heartbeat();
  await logoutUnusedRoles();

  setInterval(heartbeat, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') heartbeat();
  });
  // Closing the tab or navigating to another site: this tab no longer counts as open.
  window.addEventListener('pagehide', forgetThisTab);
  // Coming back to a page kept in the back/forward cache also means the user had left the portal.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    endTabSession();
    window.location.reload();
  });
}

/** The server reports that this tab's account was replaced by a sign-in in another tab. */
export function handleSessionSwitched() {
  const role = getTabSession()?.role;
  endTabSession();
  window.location.assign(LOGIN_PATHS[role] || '/');
}
