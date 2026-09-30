import { Router } from 'express';
import { listMyComplaints, submitComplaintFeedback, createComplaint } from '../controllers/complaintController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { complaintFeedbackValidationRules, handleValidation } from '../middleware/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', listMyComplaints);
router.post('/', createComplaint);
router.post('/:id/feedback', complaintFeedbackValidationRules, handleValidation, submitComplaintFeedback);

export default router;
