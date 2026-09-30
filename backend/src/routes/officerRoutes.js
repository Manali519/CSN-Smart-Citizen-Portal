import { Router } from 'express';
import {
  officerLogin,
  listDepartmentRequests,
  acceptRequest,
  markComplete,
  submitRating,
} from '../controllers/officerController.js';

const router = Router();

// Officer mock login (no auth middleware — mock credentials accepted)
router.post('/login', officerLogin);

// List requests routed to a department
// GET /api/officer/requests?department=Water Supply and Drainage Department
router.get('/requests', listDepartmentRequests);

// Accept a request (status → request_accepted, fires mock notification)
router.post('/accept', acceptRequest);

// Mark request as completed
router.post('/complete', markComplete);

// Submit user rating for a completed request
router.post('/rate', submitRating);

export default router;
