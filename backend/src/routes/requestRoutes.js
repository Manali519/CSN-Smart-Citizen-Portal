import { Router } from 'express';
import { listMyRequests, createRequest } from '../controllers/requestController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { serviceRequestValidationRules, handleValidation } from '../middleware/validators.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', listMyRequests);
router.post('/', serviceRequestValidationRules, handleValidation, createRequest);

export default router;
