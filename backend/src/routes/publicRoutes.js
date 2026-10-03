import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getAdminStats } from '../controllers/adminController.js';
import { listPublicComplaintMap } from '../controllers/complaintController.js';

// Read-only, login-free data for the citizen heatmap and analytics pages.
const router = Router();

router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again shortly.' },
  })
);

router.get('/stats', getAdminStats);
router.get('/complaint-map', listPublicComplaintMap);

export default router;
