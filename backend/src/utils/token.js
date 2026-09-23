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
  return jwt.verify(token, env.jwtSecret);
}
