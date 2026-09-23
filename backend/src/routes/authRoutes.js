import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  initiateRegistration,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  loginWithPassword,
  loginWithGoogle,
  getCurrentUser,
  logout,
  completeProfile,
} from '../controllers/authController.js';
import {
  registerValidationRules,
  verifyOtpValidationRules,
  resendOtpValidationRules,
  loginValidationRules,
  googleLoginValidationRules,
  completeProfileValidationRules,
  handleValidation,
} from '../middleware/validators.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Keep auth endpoints tightly rate-limited - these are the classic
// brute-force / email-bombing / credential-stuffing targets.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.post('/register', registerLimiter, registerValidationRules, handleValidation, initiateRegistration);
router.post('/register/verify-otp', otpLimiter, verifyOtpValidationRules, handleValidation, verifyRegistrationOtp);
router.post('/register/resend-otp', otpLimiter, resendOtpValidationRules, handleValidation, resendRegistrationOtp);

router.post('/login', loginLimiter, loginValidationRules, handleValidation, loginWithPassword);
router.post('/login/google', loginLimiter, googleLoginValidationRules, handleValidation, loginWithGoogle);

router.get('/me', requireAuth, getCurrentUser);
router.put('/profile', requireAuth, completeProfileValidationRules, handleValidation, completeProfile);
router.post('/logout', logout);

export default router;
