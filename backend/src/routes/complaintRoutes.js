import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  listCategories,
  createComplaint,
  listMyComplaints,
  listComplaintQueue,
  reviewComplaint,
  resolveComplaint,
  submitComplaintFeedback,
} from '../controllers/complaintController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireStaff } from '../middleware/requireStaff.js';
import { uploadComplaintImage, uploadProofImage } from '../middleware/upload.js';
import { complaintFeedbackValidationRules, handleValidation } from '../middleware/validators.js';

const router = Router();

// Short-window cap per citizen. The daily limit is checked per request, so this also stops a burst of
// parallel submissions from slipping past it before any of them is saved.
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => String(req.user._id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many complaints at once. Please wait a minute.' },
});

router.get('/categories', listCategories);

// Citizen
router.get('/mine', requireAuth, listMyComplaints);
router.post('/', requireAuth, submitLimiter, uploadComplaintImage, createComplaint);
router.post('/:id/feedback', requireAuth, complaintFeedbackValidationRules, handleValidation, submitComplaintFeedback);

// Officer / admin
router.get('/queue', requireStaff('officer', 'admin'), listComplaintQueue);
router.patch('/:id/resolve', requireStaff('officer'), uploadProofImage, resolveComplaint);
router.patch('/:id/review', requireStaff('admin'), reviewComplaint);

export default router;
