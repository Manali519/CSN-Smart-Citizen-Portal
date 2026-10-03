import { Router } from 'express';
import { body } from 'express-validator';
import { createGarbageBooking, getMyGarbageBookings } from '../controllers/garbageController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleValidation } from '../middleware/validators.js';

const router = Router();

const WASTE_TYPES = ['dry', 'wet', 'electronic', 'bulk_debris'];

router.use(requireAuth);

router.post(
  '/book',
  [
    body('wasteType').isIn(WASTE_TYPES).withMessage('Valid waste type is required'),
    body('wasteTypes').optional().isArray({ max: WASTE_TYPES.length }),
    body('wasteTypes.*').isIn(WASTE_TYPES).withMessage('Invalid waste type'),
    body('wasteLabels').optional().isArray({ max: WASTE_TYPES.length }),
    body('wasteLabel').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }),
    body('wasteLabels.*').isString().trim().isLength({ max: 80 }),
    body('volume').isString().trim().notEmpty().isLength({ max: 80 }).withMessage('Volume estimate is required'),
    body('pickupDate').isISO8601().withMessage('Valid pickup date is required'),
    body('timeSlot').isString().trim().notEmpty().isLength({ max: 60 }).withMessage('Time slot is required'),
    body('pickupAddress.fullName').trim().notEmpty().withMessage('Contact name is required'),
    body('pickupAddress.contactNo').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required'),
    body('pickupAddress.streetAddress').trim().notEmpty().isLength({ max: 240 }).withMessage('Pickup street address is required'),
    body('pickupAddress.ward').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }),
    body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }).withMessage('Notes must be 300 characters or fewer'),
  ],
  handleValidation,
  createGarbageBooking
);

router.get('/my-bookings', getMyGarbageBookings);

export default router;
