import { OAuth2Client } from 'google-auth-library';
import validator from 'validator';
import { env } from '../config/env.js';

const client = new OAuth2Client(env.googleClientId);

/**
 * Verifies a Google Identity Services credential (a signed JWT) against
 * Google's public keys and this app's client ID. This must always happen
 * server-side - a client-supplied "I signed in with Google as X@gmail.com"
 * claim is never trusted on its own, since it could be forged.
 *
 * Returns the verified profile fields we care about, or throws if the
 * token is invalid, expired, or issued for a different client ID.
 */
export async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Google token did not include an email address');
  }
  if (!payload.email_verified) {
    throw new Error('Google account email is not verified');
  }

  return {
    googleId: payload.sub,
    // Same normalization as express-validator's normalizeEmail() on typed emails (e.g. Gmail dots removed), so a
    // Google account and the email typed on the OTP / login forms always resolve to the same stored address.
    email: validator.normalizeEmail(payload.email) || payload.email.toLowerCase(),
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
  };
}
