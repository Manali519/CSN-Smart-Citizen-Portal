import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import {
  requireRazorpay,
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
} from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleValidation } from '../middleware/validators.js';

const router = Router();

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment attempts. Please try again later.' },
});

router.use(requireAuth, requireRazorpay);

router.get('/config', getPaymentConfig);

router.post(
  '/orders',
  orderLimiter,
  [
    body('amount').isInt({ min: 1, max: 10000 }).withMessage('Amount must be a whole number between ₹1 and ₹10,000').toInt(),
    body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  ],
  handleValidation,
  createPaymentOrder
);

router.post(
  '/verify',
  [
    body('razorpay_order_id').isString().matches(/^order_[A-Za-z0-9]+$/).withMessage('Invalid order id'),
    body('razorpay_payment_id').isString().matches(/^pay_[A-Za-z0-9]+$/).withMessage('Invalid payment id'),
    body('razorpay_signature').isString().isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invalid signature'),
  ],
  handleValidation,
  verifyPayment
);

router.get('/my-payments', getMyPayments);

export default router;
