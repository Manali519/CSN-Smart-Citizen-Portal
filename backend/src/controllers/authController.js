import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { env } from '../config/env.js';
import { verifyGoogleIdToken } from '../utils/googleAuth.js';
import { generateOtp, hashOtp, compareOtp } from '../utils/otp.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { signSessionToken } from '../utils/token.js';

/** Registration step 1: create or refresh an unverified account and email it an OTP. */
export async function initiateRegistration(req, res, next) {
  try {
    const { signupMethod } = req.body;
    let { email } = req.body;
    let googleId;

    if (signupMethod === 'google') {
      const googleProfile = await verifyGoogleIdToken(req.body.googleIdToken);

      if (email && email.toLowerCase() !== googleProfile.email) {
        return res.status(400).json({
          success: false,
          message: 'Email must match the Google account you signed in with',
        });
      }

      email = googleProfile.email;
      googleId = googleProfile.googleId;
    }

    const { firstName, lastName, dob, contactNo, streetAddress } = req.body;
    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const normalizedDob = typeof dob === 'string' ? dob.trim() : '';
    const normalizedContactNo = typeof contactNo === 'string' ? contactNo.trim() : '';
    const normalizedStreetAddress = typeof streetAddress === 'string' ? streetAddress.trim() : '';

    const existing = await User.findOne({
      $or: [{ email }, ...(normalizedContactNo ? [{ contactNo: normalizedContactNo }] : []), ...(googleId ? [{ googleId }] : [])],
    });

    if (existing && existing.isVerified) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or mobile number already exists. Please log in instead.',
      });
    }

    const user =
      existing ||
      new User({
        signupMethod,
        email,
      });

    if (normalizedFirstName) user.firstName = normalizedFirstName;
    if (normalizedLastName) user.lastName = normalizedLastName;
    if (normalizedDob) user.dob = normalizedDob;
    if (normalizedContactNo) user.contactNo = normalizedContactNo;
    if (normalizedStreetAddress) user.streetAddress = normalizedStreetAddress;
    user.email = email;
    user.signupMethod = signupMethod;
    if (googleId) user.googleId = googleId;
    if (signupMethod === 'manual' && req.body.password) {
      user.passwordHash = await hashPassword(req.body.password);
    }
    user.isVerified = false;

    await user.save();

    await issueAndSendOtp(user);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${maskEmail(user.email)}`,
      email: user.email,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or mobile number is already registered.',
      });
    }
    next(err);
  }
}

/** Registration step 2: a correct OTP verifies the account and starts a session. */
export async function verifyRegistrationOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No pending registration for this email.' });
    }
    if (user.isVerified) {
      return res.status(200).json({ success: true, message: 'Account already verified. Please log in.' });
    }

    const otpDoc = await Otp.findOne({ user: user._id, purpose: 'REGISTER' }).sort({ createdAt: -1 });
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or was never requested. Please request a new one.',
      });
    }

    if (otpDoc.attempts >= env.otp.maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    const isMatch = await compareOtp(otp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      const attemptsLeft = env.otp.maxAttempts - otpDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${Math.max(attemptsLeft, 0)} attempt(s) left.`,
      });
    }

    user.isVerified = true;
    user.verifiedAt = new Date();
    await user.save();
    await Otp.deleteMany({ user: user._id, purpose: 'REGISTER' });

    setSessionCookie(res, user);
    return res.status(200).json({ success: true, message: 'Account verified successfully.', user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** Sends a fresh registration OTP, subject to the resend cooldown. */
export async function resendRegistrationOtp(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No pending registration for this email.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified. Please log in.' });
    }

    const lastOtp = await Otp.findOne({ user: user._id, purpose: 'REGISTER' }).sort({ createdAt: -1 });
    if (lastOtp) {
      const secondsSinceLast = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
      if (secondsSinceLast < env.otp.resendCooldownSeconds) {
        const wait = Math.ceil(env.otp.resendCooldownSeconds - secondsSinceLast);
        return res.status(429).json({
          success: false,
          message: `Please wait ${wait}s before requesting another OTP.`,
        });
      }
    }

    await issueAndSendOtp(user);

    return res.status(200).json({ success: true, message: `A new OTP was sent to ${maskEmail(user.email)}` });
  } catch (err) {
    next(err);
  }
}

/** Email + password login. Unverified accounts are sent back into the OTP flow. */
export async function loginWithPassword(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_REGISTERED',
        message: 'No account found with this email. Please register first.',
      });
    }

    if (user.signupMethod === 'google') {
      return res.status(400).json({
        success: false,
        code: 'USE_GOOGLE',
        message: 'This account uses Google Sign-In. Please continue with Google instead.',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    if (!user.isVerified) {
      await issueAndSendOtp(user);
      return res.status(403).json({
        success: false,
        code: 'NOT_VERIFIED',
        message: `Your account isn't verified yet. We've sent a fresh OTP to ${maskEmail(user.email)}.`,
        email: user.email,
      });
    }

    setSessionCookie(res, user);
    return res.status(200).json({ success: true, message: 'Logged in successfully.', user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** Google Sign-In. An unknown Google account is reported (with its profile) so the client can prefill registration. */
export async function loginWithGoogle(req, res, next) {
  try {
    const googleProfile = await verifyGoogleIdToken(req.body.googleIdToken);

    const user = await User.findOne({
      $or: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_REGISTERED',
        message: 'No account found for this Google profile. Please register first.',
        profile: googleProfile,
      });
    }

    if (!user.isVerified) {
      await issueAndSendOtp(user);
      return res.status(403).json({
        success: false,
        code: 'NOT_VERIFIED',
        message: `Your account isn't verified yet. We've sent a fresh OTP to ${maskEmail(user.email)}.`,
        email: user.email,
      });
    }

    setSessionCookie(res, user);
    return res.status(200).json({ success: true, message: 'Logged in successfully.', user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** Current session user (req.user is set by requireAuth). */
export function getCurrentUser(req, res) {
  return res.status(200).json({ success: true, user: toPublicUser(req.user) });
}

export function logout(_req, res) {
  res.clearCookie('session', env.cookie).status(200).json({ success: true, message: 'Logged out.' });
}

/** Saves the profile details (all required; checked by completeProfileValidationRules). */
export async function completeProfile(req, res, next) {
  try {
    const user = req.user;
    const { firstName, lastName, dob, contactNo, streetAddress } = req.body;

    user.firstName = String(firstName).trim();
    user.lastName = String(lastName).trim();
    user.dob = String(dob).trim();
    user.contactNo = String(contactNo).trim();
    user.streetAddress = String(streetAddress).trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

function setSessionCookie(res, user) {
  const token = signSessionToken(user);
  res.cookie('session', token, {
    ...env.cookie,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function toPublicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dob: user.dob,
    contactNo: user.contactNo,
    streetAddress: user.streetAddress,
    signupMethod: user.signupMethod,
  };
}

/** Replaces any pending OTP for this user with a fresh one and emails it to the account address. */
async function issueAndSendOtp(user) {
  await Otp.deleteMany({ user: user._id, purpose: 'REGISTER' });

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

  await Otp.create({
    user: user._id,
    email: user.email,
    otpHash,
    purpose: 'REGISTER',
    expiresAt,
  });

  await sendOtpEmail({ to: user.email, firstName: user.firstName || 'there', otp });
}

function maskEmail(email) {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
}
