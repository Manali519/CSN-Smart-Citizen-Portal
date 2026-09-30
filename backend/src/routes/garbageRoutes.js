import { Router } from 'express';
import { body } from 'express-validator';
import { createGarbageBooking, getMyGarbageBookings } from '../controllers/garbageController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleValidation } from '../middleware/validators.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/book',
  [
    body('wasteType').isIn(['dry', 'wet', 'electronic', 'bulk_debris']).withMessage('Valid waste type is required'),
    body('volume').notEmpty().withMessage('Volume estimate is required'),
    body('pickupDate').notEmpty().withMessage('Pickup date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('pickupAddress.fullName').trim().notEmpty().withMessage('Contact name is required'),
    body('pickupAddress.contactNo').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required'),
    body('pickupAddress.streetAddress').trim().notEmpty().withMessage('Pickup street address is required'),
  ],
  handleValidation,
  createGarbageBooking
);

router.get('/my-bookings', getMyGarbageBookings);

export default router;
