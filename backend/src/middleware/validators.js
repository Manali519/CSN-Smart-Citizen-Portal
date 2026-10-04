import { body, validationResult } from 'express-validator';

/** Runs after the validator chain; returns a clean 400 with field-level errors. */
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please fix the highlighted fields',
      errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const MIN_AGE_YEARS = 5;

function isValidPastDob(value) {
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  if (dob > now) return false;
  const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
  return age >= MIN_AGE_YEARS;
}

export const registerValidationRules = [
  body('firstName').optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage('First name is too long'),
  body('lastName').optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage('Last name is too long'),
  body('dob')
    .optional({ checkFalsy: true })
    .custom(isValidPastDob).withMessage('Enter a valid date of birth'),
  body('contactNo')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('streetAddress').optional({ checkFalsy: true }).trim().isLength({ max: 240 }).withMessage('Street address is too long'),
  body('signupMethod').isIn(['google', 'manual']).withMessage('Invalid signup method'),
  body('googleIdToken')
    .if(body('signupMethod').equals('google'))
    .notEmpty().withMessage('Missing Google credential'),
  // Manual accounts log in with a password, so it is required (without one the account would be locked out
  // as soon as the first session expires).
  body('password')
    .if(body('signupMethod').equals('manual'))
    .isString().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must include at least one letter')
    .matches(/[0-9]/).withMessage('Password must include at least one number'),
];

export const completeProfileValidationRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
  body('dob').notEmpty().withMessage('Date of birth is required').custom(isValidPastDob).withMessage('Enter a valid date of birth'),
  body('contactNo').trim().notEmpty().withMessage('Contact number is required').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('streetAddress').trim().notEmpty().withMessage('Street address is required').isLength({ max: 240 }),
];

export const verifyOtpValidationRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('otp').trim().isLength({ min: 4, max: 8 }).withMessage('Enter the OTP you received'),
];

export const resendOtpValidationRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
];

export const loginValidationRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const googleLoginValidationRules = [
  body('googleIdToken').notEmpty().withMessage('Missing Google credential'),
];

export const complaintFeedbackValidationRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];
