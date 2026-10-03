import { env } from '../config/env.js';
import { Payment } from '../models/Payment.js';
import { generateReferenceNo } from '../utils/reference.js';
import {
  isRazorpayConfigured,
  createOrder,
  fetchPayment,
  capturePayment,
  isValidPaymentSignature,
} from '../utils/razorpay.js';

const NOT_CONFIGURED = {
  success: false,
  message: 'Online payments are not configured. Set Razorpay test-mode keys on the server.',
};

/** Rejects requests while Razorpay test keys are missing (or live keys were supplied). */
export function requireRazorpay(_req, res, next) {
  if (!isRazorpayConfigured()) return res.status(503).json(NOT_CONFIGURED);
  next();
}

/** Public checkout settings. Only the key id is exposed; the secret never leaves the server. */
export async function getPaymentConfig(_req, res) {
  return res.status(200).json({
    success: true,
    keyId: env.razorpay.keyId,
    currency: env.razorpay.currency,
    mode: 'test',
  });
}

/** Creates a Razorpay order for the logged-in citizen and records it locally as `created`. */
export async function createPaymentOrder(req, res, next) {
  try {
    const amountRupees = Number(req.body.amount);
    const description = (req.body.description || 'Smart City Portal test payment').trim();
    const amount = Math.round(amountRupees * 100); // paise
    const receipt = generateReferenceNo('PAY');

    const order = await createOrder({
      amount,
      receipt,
      notes: { userId: String(req.user._id), purpose: 'test_payment' },
    });

    const payment = await Payment.create({
      receipt,
      user: req.user._id,
      description,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
    });

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: payment.receipt,
        description: payment.description,
      },
      prefill: {
        name: [req.user.firstName, req.user.lastName].filter(Boolean).join(' '),
        email: req.user.email,
        contact: req.user.contactNo || '',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Confirms a checkout result. The signature proves the response came from Razorpay; the payment is then
 * re-fetched from the gateway so that amount, order and status are taken from Razorpay, never the browser.
 */
export async function verifyPayment(req, res, next) {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId: orderId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment order not found.' });
    }

    // Idempotent: a retried verify for an already-confirmed payment just returns it.
    if (payment.status === 'paid') {
      if (payment.razorpayPaymentId === paymentId) {
        return res.status(200).json({ success: true, payment });
      }
      return res.status(409).json({ success: false, message: 'This order has already been paid.' });
    }

    if (!isValidPaymentSignature({ orderId, paymentId, signature })) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    let gatewayPayment = await fetchPayment(paymentId);
    if (
      gatewayPayment.order_id !== orderId ||
      gatewayPayment.amount !== payment.amount ||
      gatewayPayment.currency !== payment.currency
    ) {
      return res.status(400).json({ success: false, message: 'Payment details do not match this order.' });
    }

    // Accounts with manual capture leave the payment `authorized`; capture it so the money settles.
    if (gatewayPayment.status === 'authorized') {
      gatewayPayment = await capturePayment(paymentId, payment.amount);
    }
    if (gatewayPayment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment was not completed.' });
    }

    // Conditional update guards against two concurrent verify calls both flipping the record.
    const updated = await Payment.findOneAndUpdate(
      { _id: payment._id, status: 'created' },
      {
        $set: {
          status: 'paid',
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          method: gatewayPayment.method,
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    return res.status(200).json({ success: true, payment: updated || (await Payment.findById(payment._id)) });
  } catch (err) {
    next(err);
  }
}

export async function getMyPayments(req, res, next) {
  try {
    const payments = await Payment.find({ user: req.user._id, status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(20);
    return res.status(200).json({ success: true, payments });
  } catch (err) {
    next(err);
  }
}
