import { Router } from 'express';
import { body } from 'express-validator';
import { adminLogin, adminLogout, getAdminProfile, getAdminStats } from '../controllers/adminController.js';
import { handleValidation } from '../middleware/validators.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { limitBy, byEmail } from '../middleware/rateLimits.js';

const router = Router();

// No normalizeEmail() here: it rewrites Gmail addresses (drops dots), which would not match the stored admin email.
const adminLoginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const loginLimiter = limitBy(byEmail, {
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: 'Too many login attempts. Please try again later.',
});

router.post('/login', loginLimiter, adminLoginRules, handleValidation, adminLogin);
router.get('/me', requireStaff('admin'), getAdminProfile);
router.get('/stats', requireStaff('admin'), getAdminStats);
router.post('/logout', adminLogout);

export default router;
