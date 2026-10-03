import { Router } from 'express';
import { listMyRequests } from '../controllers/requestController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', listMyRequests);

export default router;
