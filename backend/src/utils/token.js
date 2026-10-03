import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signSessionToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function verifySessionToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.aud) throw new jwt.JsonWebTokenError('Not a citizen session token');
  return payload;
}

// Officer/admin tokens carry a role and are scoped to their own audience so they are never
// interchangeable with citizen session tokens.
const STAFF_AUDIENCE = 'staff';

export function signStaffToken({ id, role, department }) {
  return jwt.sign({ sub: String(id), role, department }, env.jwtSecret, {
    expiresIn: '12h',
    audience: STAFF_AUDIENCE,
  });
}

export function verifyStaffToken(token) {
  return jwt.verify(token, env.jwtSecret, { audience: STAFF_AUDIENCE });
}
