import { Router } from 'express';
import { listMyComplaints, submitComplaintFeedback } from '../controllers/complaintController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { complaintFeedbackValidationRules, handleValidation } from '../middleware/validators.js';

const router = Router();

// Every route here requires a logged-in citizen, and every controller
// scopes its query to req.user._id - one citizen can never read or
// modify another citizen's complaints.
router.use(requireAuth);

router.get('/mine', listMyComplaints);
router.post('/:id/feedback', complaintFeedbackValidationRules, handleValidation, submitComplaintFeedback);

export default router;
