import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getAdminStats } from '../controllers/adminController.js';
import { listPublicComplaintMap } from '../controllers/complaintController.js';

// Read-only, login-free data for the citizen heatmap and analytics pages.
const router = Router();

// Behind the Vercel /api rewrite all visitors may share one proxy IP, so this is a generous overall cap per
// instance rather than a per-visitor limit.
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again shortly.' },
  })
);

router.get('/stats', getAdminStats);
router.get('/complaint-map', listPublicComplaintMap);

export default router;
