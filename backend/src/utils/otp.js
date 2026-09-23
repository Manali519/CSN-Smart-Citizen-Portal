import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/** Generates a numeric OTP of the configured length using a CSPRNG. */
export function generateOtp() {
  const digits = env.otp.length;
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(crypto.randomInt(min, max + 1));
}

/** Hashes an OTP the same way a password would be hashed - never store it raw. */
export async function hashOtp(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

/** Compares a user-submitted OTP against the stored hash. */
export async function compareOtp(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}
