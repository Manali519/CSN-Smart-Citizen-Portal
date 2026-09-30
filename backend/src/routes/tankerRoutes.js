import { Router } from 'express';
import { body } from 'express-validator';
import {
  getWaterSources,
  createTankerBooking,
  getMyTankerBookings,
  getTankerTracking,
  updateTankerStatus,
} from '../controllers/tankerController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleValidation } from '../middleware/validators.js';

const router = Router();

// Sources list is public/viewable even before booking
router.get('/sources', getWaterSources);

// All booking & tracking routes require logged-in citizen session
router.use(requireAuth);

router.post(
  '/book',
  [
    body('sourceId').notEmpty().withMessage('Source reservoir is required'),
    body('quantity').isInt({ min: 500, max: 50000 }).withMessage('Valid water quantity is required'),
    body('paymentMethod').isIn(['cash', 'upi']).withMessage('Payment method must be cash or upi'),
    body('deliveryAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('deliveryAddress.contactNo').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required'),
    body('deliveryAddress.streetAddress').trim().notEmpty().withMessage('Delivery address is required'),
  ],
  handleValidation,
  createTankerBooking
);

router.get('/my-bookings', getMyTankerBookings);
router.get('/track/:id', getTankerTracking);
router.post('/update-status/:id', updateTankerStatus);

export default router;
