import { Router } from 'express';
import { body } from 'express-validator';
import {
  getWaterSources,
  createTankerBooking,
  getMyTankerBookings,
} from '../controllers/tankerController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleValidation } from '../middleware/validators.js';

const router = Router();

// Sources are public so visitors can browse before logging in
router.get('/sources', getWaterSources);

router.use(requireAuth);

router.post(
  '/book',
  [
    body('sourceId').notEmpty().withMessage('Source reservoir is required'),
    body('quantity').isInt({ min: 500, max: 50000 }).withMessage('Valid water quantity is required'),
    body('paymentMethod').isIn(['cash', 'upi']).withMessage('Payment method must be cash or upi'),
    body('deliveryAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('deliveryAddress.contactNo').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required'),
    body('deliveryAddress.streetAddress').trim().notEmpty().isLength({ max: 240 }).withMessage('Delivery address is required'),
    body(['deliveryAddress.landmark', 'deliveryAddress.ward', 'deliveryAddress.pincode']).optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
    body('deliveryAddress.coordinates.lat').optional().isFloat({ min: -90, max: 90 }).toFloat(),
    body('deliveryAddress.coordinates.lng').optional().isFloat({ min: -180, max: 180 }).toFloat(),
    body('selectedAddonIds').optional().isArray({ max: 10 }),
    body('selectedAddonIds.*').isString(),
    body('deliverySlot').optional().isString().isLength({ max: 60 }),
  ],
  handleValidation,
  createTankerBooking
);

router.get('/my-bookings', getMyTankerBookings);

export default router;
