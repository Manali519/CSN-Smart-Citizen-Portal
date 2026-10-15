import { verifySessionToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { portalTab, sessionSwitched } from './portalTab.js';

export async function requireAuth(req, res, next) {
  try {
    // A staff tab never acts with the citizen session that may also be open in this browser.
    const tab = portalTab(req);
    const token = req.cookies?.session;
    if (!token || (tab.role && tab.role !== 'citizen')) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }

    if (User.db?.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service is temporarily unavailable. Please try again later.',
      });
    }

    const payload = verifySessionToken(token);
    if (tab.subject && tab.subject !== String(payload.sub)) return sessionSwitched(res);
    const user = await User.findById(payload.sub).maxTimeMS(4000);

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: 'Session is no longer valid. Please log in again.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}
