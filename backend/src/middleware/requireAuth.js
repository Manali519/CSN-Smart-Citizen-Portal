import { verifySessionToken } from '../utils/token.js';
import { User } from '../models/User.js';

/** Protects a route: requires a valid session cookie, attaches the verified user to req.user. */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }

    const payload = verifySessionToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: 'Session is no longer valid. Please log in again.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}
