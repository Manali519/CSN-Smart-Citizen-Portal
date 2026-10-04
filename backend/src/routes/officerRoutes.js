import { Router } from 'express';
import {
  officerLogin,
  officerLogout,
  listDepartmentRequests,
  acceptRequest,
  markComplete,
  submitRating,
} from '../controllers/officerController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { limitBy } from '../middleware/rateLimits.js';

const router = Router();

const loginLimiter = limitBy((req) => req.body?.officerId, {
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: 'Too many login attempts. Please try again later.',
});

router.post('/login', loginLimiter, officerLogin);
router.post('/logout', officerLogout);

// Officer only; the department comes from the signed session
router.get('/requests', requireStaff('officer'), listDepartmentRequests);
router.post('/accept', requireStaff('officer'), acceptRequest);
router.post('/complete', requireStaff('officer'), markComplete);

// Citizen rates their own completed request
router.post('/rate', requireAuth, submitRating);

export default router;
